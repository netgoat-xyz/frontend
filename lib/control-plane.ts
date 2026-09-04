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

export type WafAction = 'BLOCK' | 'ALLOW' | 'LOG'

export type DomainWafRule = {
  name: string
  expression: string
  action: WafAction
  priority: number
  enabled: boolean
  description?: string
}

/**
 * Mongo fields this dashboard writes that stream-server reads.
 * `route_policy` is emitted to agents as `policy`.
 */
export const STREAMER_DOMAIN_FIELDS = [
  'domain',
  'target_url',
  'certificate_pem',
  'private_key_pem',
  'auto_ssl',
  'ssl_enabled',
  'waf_rules',
  'route_policy',
  'subdomains',
] as const

export const STREAMER_PROXY_FIELDS = [
  'domain_id',
  'subdomain',
  'upstream_servers',
  'enabled',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

export function normalizeRoutePolicy(value: unknown): RoutePolicy | undefined {
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

export function normalizePemMaterial(certificatePem?: string, privateKeyPem?: string) {
  const certificate = String(certificatePem || '').trim()
  const privateKey = String(privateKeyPem || '').trim()

  if (!certificate && !privateKey) {
    return {
      certificate_pem: null,
      private_key_pem: null,
      ssl_enabled: false
    }
  }

  if (!certificate || !privateKey) {
    throw new Error('Certificate PEM and private key PEM must be provided together')
  }

  if (!certificate.includes('BEGIN CERTIFICATE') || !certificate.includes('END CERTIFICATE')) {
    throw new Error('Certificate PEM does not appear to be valid')
  }

  if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
    throw new Error('Private key PEM does not appear to be valid')
  }

  return {
    certificate_pem: certificate,
    private_key_pem: privateKey,
    ssl_enabled: true
  }
}

export function normalizeDomainWafRule(input: {
  name?: string
  expression?: string
  action?: string
  priority?: number
  description?: string
  enabled?: boolean
}): DomainWafRule {
  const name = String(input.name || '').trim()
  const expression = String(input.expression || '').trim()
  if (!name) {
    throw new Error('WAF rule name is required')
  }
  if (!expression) {
    throw new Error('WAF rule expression is required')
  }

  const rawAction = String(input.action || 'BLOCK').trim().toUpperCase()
  if (rawAction !== 'BLOCK' && rawAction !== 'ALLOW' && rawAction !== 'LOG') {
    throw new Error('WAF rule action must be BLOCK, ALLOW, or LOG')
  }

  const priority = input.priority ?? 0
  if (!Number.isInteger(priority) || priority < 0 || priority > 100000) {
    throw new Error('WAF rule priority must be an integer between 0 and 100000')
  }

  const description = String(input.description || '').trim()
  return {
    name,
    expression,
    action: rawAction,
    priority,
    enabled: input.enabled !== false,
    ...(description ? { description } : {})
  }
}

export function mongoFieldsFromOriginSave(targetUrl: string) {
  return {
    target_url: targetUrl
  }
}

export function mongoFieldsFromSslSave(input: {
  auto_ssl: boolean
  certificate_pem: string | null
  private_key_pem: string | null
  ssl_enabled: boolean
}) {
  return {
    auto_ssl: input.auto_ssl,
    certificate_pem: input.certificate_pem,
    private_key_pem: input.private_key_pem,
    ssl_enabled: input.ssl_enabled
  }
}

export function mongoFieldsFromRoutePolicySave(routePolicy: RoutePolicy | null) {
  return routePolicy ? { route_policy: routePolicy } : { route_policy: null }
}

export function mongoFieldsFromProxyPoolSave(input: {
  domainId: string
  subdomain?: string
  upstreamServers: string[]
  enabled?: boolean
}) {
  return {
    domain_id: input.domainId,
    subdomain: input.subdomain || '',
    upstream_servers: input.upstreamServers.map((url) => ({ url })),
    enabled: input.enabled !== false,
    target_url: input.upstreamServers[0]
  }
}
