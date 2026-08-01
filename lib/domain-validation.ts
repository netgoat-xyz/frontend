const IANA_TLD_LIST_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt'
const TLD_CACHE_TTL_MS = 12 * 60 * 60 * 1000

const DOMAIN_CHARS_REGEX = /^[a-z0-9.-]+$/
const DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const LOCAL_DEVELOPMENT_SUFFIXES = [
  'localhost',
  'test',
  'example',
  'invalid',
  'local',
  'internal',
  'home.arpa'
] as const

export type TldSource = 'online' | 'cache' | 'local' | 'unavailable'
export type DomainKind = 'public' | 'local'

export interface DomainValidationResult {
  valid: boolean
  sanitized: string
  message?: string
  tld?: string
  tldSource?: TldSource
  domainKind?: DomainKind
}

let tldCache: Set<string> | null = null
let tldCacheFetchedAt = 0
let tldFetchInFlight: Promise<Set<string> | null> | null = null

export function sanitizeDomainInput(input: string): string {
  let domain = (input || '').trim().toLowerCase()

  if (!domain) {
    return ''
  }

  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  domain = domain.replace(/^\/+/, '')

  if (domain.includes('@')) {
    const parts = domain.split('@')
    domain = parts[parts.length - 1] || ''
  }

  domain = domain.split('/')[0] || ''
  domain = domain.split('?')[0] || ''
  domain = domain.split('#')[0] || ''

  if (domain.startsWith('[') && domain.endsWith(']')) {
    domain = domain.slice(1, -1)
  }

  const lastColonIndex = domain.lastIndexOf(':')
  if (lastColonIndex > -1 && domain.indexOf(':') === lastColonIndex) {
    const maybePort = domain.slice(lastColonIndex + 1)
    if (/^\d+$/.test(maybePort)) {
      domain = domain.slice(0, lastColonIndex)
    }
  }

  domain = domain.replace(/^\.+/, '').replace(/\.+$/, '')

  return domain
}

export function validateDomainSyntax(input: string): DomainValidationResult {
  const sanitized = sanitizeDomainInput(input)
  const localDevelopmentDomain = isLocalDevelopmentDomain(sanitized)

  if (!sanitized) {
    return {
      valid: false,
      sanitized,
      message: 'Domain is required'
    }
  }

  if (sanitized.length > 253) {
    return {
      valid: false,
      sanitized,
      message: 'Domain exceeds the maximum length'
    }
  }

  if (!DOMAIN_CHARS_REGEX.test(sanitized) || sanitized.includes('..')) {
    return {
      valid: false,
      sanitized,
      message: 'Domain contains invalid characters'
    }
  }

  const labels = sanitized.split('.')
  if (labels.length < 2 && sanitized !== 'localhost') {
    return {
      valid: false,
      sanitized,
      message: 'Domain must include a top-level domain'
    }
  }

  for (const label of labels) {
    if (!DOMAIN_LABEL_REGEX.test(label)) {
      return {
        valid: false,
        sanitized,
        message: 'Domain labels must be 1-63 chars and cannot start or end with a hyphen'
      }
    }
  }

  const tld = labels[labels.length - 1]
  if (!tld || tld.length < 2 || /^\d+$/.test(tld)) {
    return {
      valid: false,
      sanitized,
      message: 'Top-level domain is invalid'
    }
  }

  return {
    valid: true,
    sanitized,
    tld,
    domainKind: localDevelopmentDomain ? 'local' : 'public'
  }
}

export function isLocalDevelopmentDomain(input: string): boolean {
  const sanitized = sanitizeDomainInput(input)
  if (!sanitized) return false
  if (sanitized === 'localhost') return true

  return LOCAL_DEVELOPMENT_SUFFIXES.some((suffix) => {
    return sanitized === suffix || sanitized.endsWith(`.${suffix}`)
  })
}

function parseIanaTldList(rawList: string): Set<string> {
  const tlds = new Set<string>()

  for (const line of rawList.split('\n')) {
    const normalized = line.trim().toLowerCase()
    if (!normalized || normalized.startsWith('#')) {
      continue
    }

    tlds.add(normalized)
  }

  return tlds
}

async function fetchOnlineTldList(): Promise<{ tlds: Set<string> | null; source: TldSource }> {
  const now = Date.now()
  if (tldCache && now - tldCacheFetchedAt < TLD_CACHE_TTL_MS) {
    return { tlds: tldCache, source: 'cache' }
  }

  if (!tldFetchInFlight) {
    tldFetchInFlight = (async () => {
      try {
        const response = await fetch(IANA_TLD_LIST_URL, {
          cache: 'no-store'
        })

        if (!response.ok) {
          return null
        }

        const body = await response.text()
        const parsed = parseIanaTldList(body)
        if (parsed.size === 0) {
          return null
        }

        tldCache = parsed
        tldCacheFetchedAt = Date.now()
        return parsed
      } catch {
        return null
      } finally {
        tldFetchInFlight = null
      }
    })()
  }

  const fetchedTlds = await tldFetchInFlight
  if (fetchedTlds) {
    return { tlds: fetchedTlds, source: 'online' }
  }

  if (tldCache) {
    return { tlds: tldCache, source: 'cache' }
  }

  return { tlds: null, source: 'unavailable' }
}

export async function validateDomainWithOnlineTld(input: string): Promise<DomainValidationResult> {
  const syntaxResult = validateDomainSyntax(input)
  if (!syntaxResult.valid || !syntaxResult.tld) {
    return syntaxResult
  }

  if (syntaxResult.domainKind === 'local' || isLocalDevelopmentDomain(syntaxResult.sanitized)) {
    return {
      valid: true,
      sanitized: syntaxResult.sanitized,
      tld: syntaxResult.tld,
      tldSource: 'local',
      domainKind: 'local'
    }
  }

  const { tlds, source } = await fetchOnlineTldList()
  if (!tlds) {
    return {
      valid: false,
      sanitized: syntaxResult.sanitized,
      tld: syntaxResult.tld,
      tldSource: source,
      domainKind: 'public',
      message: 'Unable to validate the top-level domain right now. Please try again.'
    }
  }

  if (!tlds.has(syntaxResult.tld)) {
    return {
      valid: false,
      sanitized: syntaxResult.sanitized,
      tld: syntaxResult.tld,
      tldSource: source,
      domainKind: 'public',
      message: `Unsupported top-level domain: .${syntaxResult.tld}`
    }
  }

  return {
    valid: true,
    sanitized: syntaxResult.sanitized,
    tld: syntaxResult.tld,
    tldSource: source,
    domainKind: 'public'
  }
}

export function sanitizeSubdomainLabel(input: string): string {
  return (input || '').trim().toLowerCase().replace(/^\.+/, '').replace(/\.+$/, '')
}

export function isValidSubdomainLabel(input: string): boolean {
  const sanitized = sanitizeSubdomainLabel(input)
  return DOMAIN_LABEL_REGEX.test(sanitized)
}
