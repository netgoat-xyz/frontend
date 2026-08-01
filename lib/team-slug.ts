const TEAM_SLUG_MIN_LENGTH = 2
const TEAM_SLUG_MAX_LENGTH = 48

const RESERVED_TEAM_SLUGS = new Set([
  'account',
  'activity',
  'admin',
  'api',
  'auth',
  'dashboard',
  'developers',
  'integrations',
  'me',
  'new',
  'settings',
  'teams'
])

export interface TeamSlugValidationResult {
  valid: boolean
  sanitized: string
  message?: string
}

export function sanitizeTeamSlug(input: string): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TEAM_SLUG_MAX_LENGTH)
}

export function validateTeamSlug(input: string): TeamSlugValidationResult {
  const sanitized = sanitizeTeamSlug(input)

  if (!sanitized) {
    return {
      valid: false,
      sanitized,
      message: 'Team slug is required'
    }
  }

  if (sanitized.length < TEAM_SLUG_MIN_LENGTH) {
    return {
      valid: false,
      sanitized,
      message: `Team slug must be at least ${TEAM_SLUG_MIN_LENGTH} characters`
    }
  }

  if (sanitized.length > TEAM_SLUG_MAX_LENGTH) {
    return {
      valid: false,
      sanitized,
      message: `Team slug must be ${TEAM_SLUG_MAX_LENGTH} characters or fewer`
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      message: 'Team slug can only include letters, numbers, and hyphens'
    }
  }

  if (RESERVED_TEAM_SLUGS.has(sanitized)) {
    return {
      valid: false,
      sanitized,
      message: 'That team slug is reserved'
    }
  }

  return {
    valid: true,
    sanitized
  }
}

