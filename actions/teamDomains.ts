'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import Domain from '@/models/Domain'
import { Team } from '@/models/Team'
import DNSRecord from '@/models/DNSRecord'
import ProxyConfig from '@/models/ProxyConfig'
import { revalidatePath } from 'next/cache'

async function resolveTeam(teamSlug: string, userId: string, userName: string) {
  // Decode URL-encoded parameters (e.g., %40me -> @me)
  const decodedTeamSlug = decodeURIComponent(teamSlug)
  
  let team
  
  if (decodedTeamSlug === '@me' || decodedTeamSlug.startsWith('@me-')) {
    // @me is a convenience descriptor that always maps to the user's personal team slug
    const personalSlug = `@me-${userId}`
    
    // Try to find existing personal team
    team = await Team.findOne({
      slug: personalSlug
    })
    
    if (!team) {
      try {
        // Create personal team on-the-fly if it doesn't exist
        team = await Team.create({
          name: `${userName}'s Personal Team`,
          slug: personalSlug,
          description: 'Your personal team',
          members: [{
            user_id: userId,
            role: 'owner',
            joined_at: new Date()
          }],
          active: true
        })
        console.log(`Created personal team ${personalSlug} for user ${userId}`)
      } catch (err: any) {
        console.error("Team creation failed:", err);
        // If creation fails (e.g., duplicate slug from race condition), try finding it again
        if (err.code === 11000 || err.message?.includes('duplicate')) {
          team = await Team.findOne({
            slug: personalSlug
          })
          if (!team) {
            throw new Error(`Failed to resolve personal team for ${userId}`)
          }
        } else {
          throw err
        }
      }
    }
  } else {
    const cleanSlug = decodedTeamSlug.replace(/^@/, '')
    team = await Team.findBySlug(cleanSlug)
  }
  
  return team
}

export async function getUserTeamDomainHierarchy() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const teams = await Team.findUserTeams(session.user.id)
  const hierarchyTeams = await Promise.all(
    teams.map(async (team: any) => {
      const domains = await listTeamDomains(team.slug)
      return {
        id: team._id,
        name: team.name,
        slug: team.slug,
        role: Team.getUserRole(team, session.user.id),
        domains
      }
    })
  )

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    },
    teams: hierarchyTeams
  }
}

export async function createDomainForTeam(
  teamSlug: string,
  data: {
    domain: string
    target_url: string
    certificate_pem?: string
    private_key_pem?: string
    auto_ssl?: boolean
    verification_token?: string // Allow passing existing token
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  if (!team.can_add_domain) {
    throw new Error(`Domain limit reached (${team.max_domains} max)`)
  }

  // Use provided token or generate a new one
  const crypto = require('crypto')
  const verificationToken = data.verification_token || `netgoat-verify-${crypto.randomBytes(32).toString('hex')}`
  
  // Set next verification check for 30 minutes from now
  const nextCheck = new Date()
  nextCheck.setMinutes(nextCheck.getMinutes() + 30)

  const domain = await Domain.create({
    team_id: team._id,
    domain: data.domain,
    target_url: data.target_url,
    certificate_pem: data.certificate_pem || null,
    private_key_pem: data.private_key_pem || null,
    ssl_enabled: !!(data.certificate_pem && data.private_key_pem),
    auto_ssl: data.auto_ssl || false,
    active: true,
    verified: false,
    verification_token: verificationToken,
    verification_attempts: 0,
    next_verification_check: nextCheck,
    waf_rules: [],
    subdomains: [],
    settings: {
      rate_limit: 100,
      cache_enabled: true,
      cache_ttl: 300,
      compression_enabled: true,
      log_level: 'errors'
    },
    stats: {
      total_requests: 0,
      total_blocked: 0,
      bandwidth_used: 0
    }
  })

  team.domain_count += 1
  team.updated_at = new Date()
  await team.save()

  revalidatePath(`/dashboard/${teamSlug}`)
  return { 
    success: true, 
    domain: domain.toObject(),
    verification: {
      token: verificationToken,
      recordName: '_netgoat-verify',
      recordType: 'TXT',
      recordValue: verificationToken
    }
  }
}

export async function listTeamDomains(teamSlug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  // Use resolveTeam to handle special slugs like @me
  const team = await resolveTeam(
    teamSlug,
    session.user.id,
    session.user.name || 'User'
  )
  
  if (!team) {
    throw new Error(`Team not found: '${teamSlug}' (user: ${session.user.id}, decoded: ${decodeURIComponent(teamSlug)})`)
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Insufficient permissions')
  }

  const domains = await Domain.find({
    team_id: team._id,
    active: true
  })
    .sort({ created_at: -1 })
    .lean()

  const domainIds = domains.map((d: any) => d._id)
  if (domainIds.length === 0) {
    return []
  }

  const [dnsRecords, proxyConfigs] = await Promise.all([
    DNSRecord.find({
      team_id: team._id,
      domain_id: { $in: domainIds },
      active: true
    }).lean(),
    ProxyConfig.find({
      team_id: team._id,
      domain_id: { $in: domainIds },
      enabled: true
    }).lean()
  ])

  const dnsByDomain = new Map<string, any[]>()
  for (const record of dnsRecords as any[]) {
    const domainId = record.domain_id?.toString()
    if (!domainId) continue
    if (!dnsByDomain.has(domainId)) dnsByDomain.set(domainId, [])
    dnsByDomain.get(domainId)!.push(record)
  }

  const proxyByDomain = new Map<string, any[]>()
  for (const cfg of proxyConfigs as any[]) {
    const domainId = cfg.domain_id?.toString()
    if (!domainId) continue
    if (!proxyByDomain.has(domainId)) proxyByDomain.set(domainId, [])
    proxyByDomain.get(domainId)!.push(cfg)
  }

  const enrichedDomains = (domains as any[]).map((domain) => {
    const domainId = domain._id.toString()
    const domainDNS = dnsByDomain.get(domainId) || []
    const domainProxy = proxyByDomain.get(domainId) || []

    const subdomains = Array.isArray(domain.subdomains) ? domain.subdomains : []
    const subdomainMap = new Map<string, any>()
    for (const sub of subdomains) {
      subdomainMap.set(sub.subdomain, {
        ...sub,
        dns_records: [],
        proxy_configs: []
      })
    }

    const rootDNS: any[] = []
    for (const record of domainDNS) {
      const name = record.name === '@' ? '' : record.name
      if (!name) {
        rootDNS.push(record)
        continue
      }

      const existingSub = subdomainMap.get(name)
      if (existingSub) {
        existingSub.dns_records.push(record)
      } else {
        rootDNS.push(record)
      }
    }

    const rootProxy: any[] = []
    for (const config of domainProxy) {
      const sub = config.subdomain?.trim()
      if (!sub) {
        rootProxy.push(config)
        continue
      }

      const existingSub = subdomainMap.get(sub)
      if (existingSub) {
        existingSub.proxy_configs.push(config)
      } else {
        rootProxy.push(config)
      }
    }

    return {
      ...domain,
      dns_records: rootDNS,
      proxy_configs: rootProxy,
      subdomains: Array.from(subdomainMap.values())
    }
  })

  return JSON.parse(JSON.stringify(enrichedDomains))
}

export async function getDomain(teamSlug: string, domainId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  }).lean()

  if (!domain) {
    throw new Error('Domain not found')
  }

  return domain
}

export async function deleteDomain(teamSlug: string, domainId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await Domain.deleteOne({ _id: domainId })

  team.domain_count = Math.max(0, team.domain_count - 1)
  team.updated_at = new Date()
  await team.save()

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}


export async function addSubdomain(
  teamSlug: string,
  domainId: string,
  data: {
    subdomain: string
    target_url: string
    certificate_pem?: string
    private_key_pem?: string
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  const fullDomain = `${data.subdomain}.${domain.domain}`

  await domain.addSubdomain(data.subdomain, data.target_url, {
    certificate_pem: data.certificate_pem,
    private_key_pem: data.private_key_pem
  })

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true, subdomain: fullDomain }
}

export async function removeSubdomain(teamSlug: string, domainId: string, subdomain: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeSubdomain(subdomain)

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}


export async function addDomainWAFRule(
  teamSlug: string,
  domainId: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'ALLOW'
    priority?: number
    description?: string
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.addWAFRule(
    data.name,
    data.expression,
    data.action || 'BLOCK',
    data.priority || 0,
    data.description
  )

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}


export async function removeDomainWAFRule(teamSlug: string, domainId: string, ruleName: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeWAFRule(ruleName)

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function addSubdomainWAFRule(
  teamSlug: string,
  domainId: string,
  subdomain: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'ALLOW'
    priority?: number
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.addSubdomainWAFRule(
    subdomain,
    data.name,
    data.expression,
    data.action || 'BLOCK',
    data.priority || 0
  )

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function removeSubdomainWAFRule(
  teamSlug: string,
  domainId: string,
  subdomain: string,
  ruleName: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeSubdomainWAFRule(subdomain, ruleName)

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function updateDomainSettings(
  teamSlug: string,
  domainId: string,
  settings: {
    rate_limit?: number
    cache_enabled?: boolean
    cache_ttl?: number
    compression_enabled?: boolean
    log_level?: 'none' | 'errors' | 'all'
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOneAndUpdate(
    { _id: domainId, team_id: team._id },
    {
      $set: {
        settings: settings,
        updated_at: new Date()
      }
    },
    { new: true }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function toggleDomainActive(teamSlug: string, domainId: string, active: boolean) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
  const team = await resolveTeam(teamSlug, session.user.id, userName)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const domain = await Domain.findOneAndUpdate(
    { _id: domainId, team_id: team._id },
    {
      $set: {
        active: active,
        updated_at: new Date()
      }
    },
    { new: true }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function addReverseProxy(teamSlug: string, domainId: string, proxyData: any) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    await connectDB()
    const team = await Team.findBySlug(teamSlug.replace(/^@/, '')) || await Team.findOne({ slug: teamSlug })
    if (!team) throw new Error('Team not found')
      
    if (!Team.hasPermission(team, session.user.id, 'member')) throw new Error('Insufficient permissions')
      
    const domain = await Domain.findOne({ _id: domainId, team_id: team._id })
    if (!domain) throw new Error('Domain not found')
      
    if (!domain.reverse_proxies) domain.reverse_proxies = [];
    domain.reverse_proxies.push(proxyData);
    await domain.save();
    
    revalidatePath(`/dashboard/${teamSlug}/${domain.domain}/reverse-proxies`);
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeReverseProxy(teamSlug: string, domainId: string, proxyId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) throw new Error('Unauthorized')
    
    await connectDB()
    const team = await Team.findBySlug(teamSlug.replace(/^@/, '')) || await Team.findOne({ slug: teamSlug })
    if (!team) throw new Error('Team not found')
      
    const domain = await Domain.findOne({ _id: domainId, team_id: team._id })
    if (!domain) throw new Error('Domain not found')
      
    domain.reverse_proxies = domain.reverse_proxies.filter((p: any) => p._id.toString() !== proxyId);
    await domain.save();
    
    revalidatePath(`/dashboard/${teamSlug}/${domain.domain}/reverse-proxies`);
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
