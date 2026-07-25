'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import Domain from '@/models/Domain'
import { Team } from '@/models/Team'
import DNSRecord from '@/models/DNSRecord'
import ProxyConfig from '@/models/ProxyConfig'
import type { Types } from 'mongoose'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import dns from 'dns'
import { promisify } from 'util'
import {
  isValidSubdomainLabel,
  sanitizeSubdomainLabel,
  validateDomainWithOnlineTld
} from '@/lib/domain-validation'

const resolveTxt = promisify(dns.resolveTxt)

export type RouteKeyMode = 'ip' | 'host' | 'route' | 'global'

export type RoutePolicy = {
  cache?: {
    enabled?: boolean
    ttl_seconds?: number
    max_entries?: number
    max_body_bytes?: number
  }
  bandwidth?: {
    enabled?: boolean
    bytes_per_second?: number
    burst_bytes?: number
    key?: RouteKeyMode
  }
}

type Stringifiable = {
  toString(): string
}

type AssociatedRecord = Record<string, unknown> & {
  domain_id?: Types.ObjectId
  name?: string
  subdomain?: string
}

type DomainSubdomain = Record<string, unknown> & {
  subdomain: string
}

type EnrichedSubdomain = DomainSubdomain & {
  dns_records: AssociatedRecord[]
  proxy_configs: AssociatedRecord[]
}

type DomainRecord = Record<string, unknown> & {
  _id: Types.ObjectId
  subdomains?: DomainSubdomain[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringifiable(value: unknown): value is Stringifiable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof value.toString === 'function'
  )
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    isRecord(error) &&
    (error.code === 11000 ||
      (typeof error.message === 'string' && error.message.includes('duplicate')))
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (isRecord(error) && typeof error.message === 'string') return error.message
  return 'An unexpected error occurred'
}

function hasDocumentId(value: unknown, id: string): boolean {
  return isRecord(value) && isStringifiable(value._id) && value._id.toString() === id
}

function optionalPolicyRecord(value: unknown, field: string): Record<string, unknown> | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean`)
  }
  return value
}

function optionalBoundedInteger(
  value: unknown,
  field: string,
  min: number,
  max: number
): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`)
  }
  return value
}

function optionalRouteKey(value: unknown): RouteKeyMode | undefined {
  if (value === undefined) return undefined
  if (value === 'ip' || value === 'host' || value === 'route' || value === 'global') {
    return value
  }
  throw new Error('route_policy.bandwidth.key must be ip, host, route, or global')
}

function normalizeRoutePolicy(value: unknown): RoutePolicy | undefined {
  if (value === null) return undefined
  if (!isRecord(value)) {
    throw new Error('route_policy must be an object or null')
  }

  const cacheRaw = optionalPolicyRecord(value.cache, 'route_policy.cache')
  const bandwidthRaw = optionalPolicyRecord(value.bandwidth, 'route_policy.bandwidth')
  const policy: RoutePolicy = {}

  if (cacheRaw) {
    const cache = {
      enabled: optionalBoolean(cacheRaw.enabled, 'route_policy.cache.enabled'),
      ttl_seconds: optionalBoundedInteger(cacheRaw.ttl_seconds, 'route_policy.cache.ttl_seconds', 1, 86400),
      max_entries: optionalBoundedInteger(cacheRaw.max_entries, 'route_policy.cache.max_entries', 1, 100000),
      max_body_bytes: optionalBoundedInteger(cacheRaw.max_body_bytes, 'route_policy.cache.max_body_bytes', 1024, 104857600)
    }
    if (Object.values(cache).some((entry) => entry !== undefined)) {
      policy.cache = cache
    }
  }

  if (bandwidthRaw) {
    const bandwidth = {
      enabled: optionalBoolean(bandwidthRaw.enabled, 'route_policy.bandwidth.enabled'),
      bytes_per_second: optionalBoundedInteger(bandwidthRaw.bytes_per_second, 'route_policy.bandwidth.bytes_per_second', 1024, 10737418240),
      burst_bytes: optionalBoundedInteger(bandwidthRaw.burst_bytes, 'route_policy.bandwidth.burst_bytes', 1024, 10737418240),
      key: optionalRouteKey(bandwidthRaw.key)
    }
    if (Object.values(bandwidth).some((entry) => entry !== undefined)) {
      policy.bandwidth = bandwidth
    }
  }

  return policy.cache || policy.bandwidth ? policy : undefined
}

async function hasVerificationToken(domain: string, token: string): Promise<boolean> {
  try {
    const records = await resolveTxt(`_netgoat-verify.${domain}`)
    return records.flat().some((record) => record === token)
  } catch {
    // A missing or not-yet-propagated record keeps the new domain unverified.
    return false
  }
}

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
      } catch (err: unknown) {
        console.error("Team creation failed:", err);
        // If creation fails (e.g., duplicate slug from race condition), try finding it again
        if (isDuplicateKeyError(err)) {
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
    teams.map(async (team) => {
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

  const domainValidation = await validateDomainWithOnlineTld(data.domain)
  if (!domainValidation.valid) {
    throw new Error(domainValidation.message || 'Invalid domain name')
  }

  const normalizedDomain = domainValidation.sanitized

  const existingDomain = await Domain.findOne({
    team_id: team._id,
    domain: normalizedDomain
  }).lean()

  if (existingDomain) {
    throw new Error('Domain already exists for this team')
  }

  // Use provided token or generate a new one
  const verificationToken = data.verification_token || `netgoat-verify-${randomBytes(32).toString('hex')}`
  const verified = await hasVerificationToken(normalizedDomain, verificationToken)
  
  // Set next verification check for 30 minutes from now
  const nextCheck = new Date()
  nextCheck.setMinutes(nextCheck.getMinutes() + 30)

  const domain = await Domain.create({
    team_id: team._id,
    domain: normalizedDomain,
    target_url: data.target_url,
    certificate_pem: data.certificate_pem || null,
    private_key_pem: data.private_key_pem || null,
    ssl_enabled: !!(data.certificate_pem && data.private_key_pem),
    auto_ssl: Boolean(data.auto_ssl),
    active: true,
    verified,
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
    // Never serialize private keys into a viewer-accessible server action.
    .select({ private_key_pem: 0, 'subdomains.private_key_pem': 0 })
    .lean()

  const domainIds = (domains as unknown as DomainRecord[]).map((domain) => domain._id)
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

  const dnsByDomain = new Map<string, AssociatedRecord[]>()
  for (const record of dnsRecords as unknown as AssociatedRecord[]) {
    const domainId = record.domain_id?.toString()
    if (!domainId) continue
    if (!dnsByDomain.has(domainId)) dnsByDomain.set(domainId, [])
    dnsByDomain.get(domainId)!.push(record)
  }

  const proxyByDomain = new Map<string, AssociatedRecord[]>()
  for (const cfg of proxyConfigs as unknown as AssociatedRecord[]) {
    const domainId = cfg.domain_id?.toString()
    if (!domainId) continue
    if (!proxyByDomain.has(domainId)) proxyByDomain.set(domainId, [])
    proxyByDomain.get(domainId)!.push(cfg)
  }

  const enrichedDomains = (domains as unknown as DomainRecord[]).map((domain) => {
    const domainId = domain._id.toString()
    const domainDNS = dnsByDomain.get(domainId) || []
    const domainProxy = proxyByDomain.get(domainId) || []

    const subdomains = Array.isArray(domain.subdomains) ? domain.subdomains : []
    const subdomainMap = new Map<string, EnrichedSubdomain>()
    for (const sub of subdomains) {
      subdomainMap.set(sub.subdomain, {
        ...sub,
        dns_records: [],
        proxy_configs: []
      })
    }

    const rootDNS: AssociatedRecord[] = []
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

    const rootProxy: AssociatedRecord[] = []
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
  })
    // Certificate public data can inform the UI, but private keys must remain
    // server-only even for authorized viewers.
    .select({ private_key_pem: 0, 'subdomains.private_key_pem': 0 })
    .lean()

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

  const sanitizedSubdomain = sanitizeSubdomainLabel(data.subdomain)
  if (!isValidSubdomainLabel(sanitizedSubdomain)) {
    throw new Error('Invalid subdomain label')
  }

  const subdomainExists = Array.isArray(domain.subdomains)
    ? domain.subdomains.some(
        (entry: unknown) => isRecord(entry) && entry.subdomain === sanitizedSubdomain
      )
    : false

  if (subdomainExists) {
    throw new Error('Subdomain already exists for this domain')
  }

  const fullDomain = `${sanitizedSubdomain}.${domain.domain}`

  await domain.addSubdomain(sanitizedSubdomain, data.target_url, {
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

  const sanitizedSubdomain = sanitizeSubdomainLabel(subdomain)
  if (!isValidSubdomainLabel(sanitizedSubdomain)) {
    throw new Error('Invalid subdomain label')
  }

  await domain.removeSubdomain(sanitizedSubdomain)

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

  const sanitizedSubdomain = sanitizeSubdomainLabel(subdomain)
  if (!isValidSubdomainLabel(sanitizedSubdomain)) {
    throw new Error('Invalid subdomain label')
  }

  await domain.addSubdomainWAFRule(
    sanitizedSubdomain,
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

  const sanitizedSubdomain = sanitizeSubdomainLabel(subdomain)
  if (!isValidSubdomainLabel(sanitizedSubdomain)) {
    throw new Error('Invalid subdomain label')
  }

  await domain.removeSubdomainWAFRule(sanitizedSubdomain, ruleName)

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
    route_policy?: RoutePolicy | null
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

  const updates: Record<string, unknown> = {
    updated_at: new Date()
  }
  const unsets: Record<string, 1> = {}

  if (settings.rate_limit !== undefined) {
    updates['settings.rate_limit'] = settings.rate_limit
  }
  if (settings.cache_enabled !== undefined) {
    updates['settings.cache_enabled'] = settings.cache_enabled
  }
  if (settings.cache_ttl !== undefined) {
    updates['settings.cache_ttl'] = settings.cache_ttl
  }
  if (settings.compression_enabled !== undefined) {
    updates['settings.compression_enabled'] = settings.compression_enabled
  }
  if (settings.log_level !== undefined) {
    updates['settings.log_level'] = settings.log_level
  }
  if (settings.route_policy !== undefined) {
    const routePolicy = normalizeRoutePolicy(settings.route_policy)
    if (routePolicy) {
      updates.route_policy = routePolicy
    } else {
      // An empty policy intentionally restores inheritance from the global
      // agent configuration instead of persisting an ambiguous empty object.
      unsets.route_policy = 1
    }
  }

  const domain = await Domain.findOneAndUpdate(
    { _id: domainId, team_id: team._id },
    {
      // Dot notation updates only fields supplied by the caller. Replacing the
      // settings object caused unrelated defaults and existing policy values to
      // disappear on every partial update.
      $set: updates,
      ...(Object.keys(unsets).length > 0 ? { $unset: unsets } : {})
    },
    { returnDocument: "after", runValidators: true }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath(`/dashboard/${teamSlug}`)
  revalidatePath(`/dashboard/${teamSlug}/${domain.domain}`)
  revalidatePath(`/dashboard/${teamSlug}/${domain.domain}/settings`)
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
    { returnDocument: "after" }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

export async function addReverseProxy(
  teamSlug: string,
  domainId: string,
  proxyData: Record<string, unknown>
) {
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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
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
      
    domain.reverse_proxies = domain.reverse_proxies.filter(
      (proxy: unknown) => !hasDocumentId(proxy, proxyId)
    );
    await domain.save();
    
    revalidatePath(`/dashboard/${teamSlug}/${domain.domain}/reverse-proxies`);
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}
