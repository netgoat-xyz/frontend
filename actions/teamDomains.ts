'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import Domain from '@/models/Domain'
import { Team } from '@/models/Team'
import { revalidatePath } from 'next/cache'

async function resolveTeam(teamSlug: string, userId: string, userName: string) {
  // Decode URL-encoded parameters (e.g., %40me -> @me)
  const decodedTeamSlug = decodeURIComponent(teamSlug)
  
  let team
  
  if (decodedTeamSlug === '@me' || decodedTeamSlug.startsWith('@me-')) {
    // Look for user's personal team with user-specific slug
    const personalSlug = decodedTeamSlug === '@me' ? `@me-${userId}` : decodedTeamSlug;
    team = await Team.findOne({
      slug: personalSlug
    })
    
    if (!team) {
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
    }
  } else {
    const cleanSlug = decodedTeamSlug.replace(/^@/, '')
    team = await Team.findBySlug(cleanSlug)
  }
  
  return team
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
    throw new Error('Team not found')
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

  // Properly serialize to plain objects for client components
  return JSON.parse(JSON.stringify(domains))
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
