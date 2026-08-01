const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

export interface OriginUrlValidationResult {
  valid: boolean
  normalized: string
  message?: string
}

export function normalizeOriginUrl(input: string): string {
  let value = String(input || '').trim()
  if (!value) return ''

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = `http://${value}`
  }

  try {
    const url = new URL(value)
    if (!HTTP_PROTOCOLS.has(url.protocol)) {
      return ''
    }

    url.username = ''
    url.password = ''
    url.hash = ''
    url.search = ''

    const origin = `${url.protocol}//${url.host}`
    const path = url.pathname && url.pathname !== '/' ? url.pathname.replace(/\/+$/, '') : ''
    return `${origin}${path}`
  } catch {
    return ''
  }
}

export function validateOriginUrl(input: string): OriginUrlValidationResult {
  const normalized = normalizeOriginUrl(input)

  if (!normalized) {
    return {
      valid: false,
      normalized,
      message: 'Origin URL must be a valid http or https URL'
    }
  }

  try {
    const url = new URL(normalized)
    if (!HTTP_PROTOCOLS.has(url.protocol)) {
      return {
        valid: false,
        normalized,
        message: 'Origin URL must use http or https'
      }
    }

    if (!url.hostname) {
      return {
        valid: false,
        normalized,
        message: 'Origin URL hostname is required'
      }
    }

    return {
      valid: true,
      normalized
    }
  } catch {
    return {
      valid: false,
      normalized,
      message: 'Origin URL must be a valid http or https URL'
    }
  }
}

