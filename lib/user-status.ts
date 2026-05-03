type SessionLike = {
  user?: {
    banned?: unknown
  }
} | null | undefined

export function isBannedSessionUser(session: SessionLike) {
  return (session?.user as { banned?: unknown } | undefined)?.banned === true
}
