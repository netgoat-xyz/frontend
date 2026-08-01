'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import { Team } from '@/models/Team'
import User from '@/models/User'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'
import { sendTeamInviteEmail } from '@/lib/email'
import { validateTeamSlug } from '@/lib/team-slug'
import type {
  ITeam,
  ITeamAccessGroup,
  ITeamMember,
  TeamCapability,
  TeamRoleInheritance
} from '@/models/Team'

export type TeamAssignableRole = 'admin' | 'billing_manager' | 'member' | 'viewer' | string
type AccessGroupDefaultRole = 'viewer' | 'member' | 'admin'
type TeamSettingsDraft = {
  access_groups?: ITeamAccessGroup[]
  webhooks?: {
    endpoint_url?: string
    signing_secret?: string
    events?: string[]
    updated_at?: Date
    updated_by?: mongoose.Types.ObjectId
  }
  auth_methods?: {
    magic_link?: boolean
    email_code?: boolean
  }
  retention_days?: number
  require_2fa?: boolean
  billing?: Partial<ITeam['settings']['billing']>
}
type TeamWithLegacySettings = Omit<ITeam, 'settings'> & {
  settings?: TeamSettingsDraft
}
type TeamMemberUser = {
  _id: mongoose.Types.ObjectId
  name?: string
  email?: string
}
const WEBHOOK_EVENTS = ['incident.updated', 'domain.status.changed', 'billing.updated'] as const
type TeamWebhookEvent = (typeof WEBHOOK_EVENTS)[number]
const WEBHOOK_EVENT_SET = new Set<string>(WEBHOOK_EVENTS)

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

function hasCapabilityOrRole(
  team: ITeam,
  userId: string,
  capability: TeamCapability,
  fallbackRole: 'owner' | 'admin' | 'member' | 'viewer'
) {
  return Team.hasCapability(team, userId, capability) || Team.hasPermission(team, userId, fallbackRole)
}

function maskSecret(secret: string) {
  if (secret.length <= 6) {
    return '*'.repeat(secret.length)
  }

  return `${secret.slice(0, 4)}${'*'.repeat(secret.length - 6)}${secret.slice(-2)}`
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function normalizeAccessRole(value: unknown): AccessGroupDefaultRole {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'admin') return 'admin'
  if (normalized === 'member') return 'member'
  return 'viewer'
}

function normalizeWebhookEvents(value: unknown): TeamWebhookEvent[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const normalized: TeamWebhookEvent[] = []

  for (const event of value) {
    const eventName = String(event || '').trim()
    if (!WEBHOOK_EVENT_SET.has(eventName) || seen.has(eventName)) {
      continue
    }

    seen.add(eventName)
    normalized.push(eventName as TeamWebhookEvent)
  }

  return normalized
}

function getDefaultGroupMemberCount(team: ITeam, defaultRole: AccessGroupDefaultRole) {
  if (!Array.isArray(team?.members)) return 0

  return team.members.reduce((count: number, member: ITeamMember) => {
    const memberRole = String(member?.role || '').trim().toLowerCase()

    if (defaultRole === 'admin') {
      return count + (memberRole === 'owner' || memberRole === 'admin' ? 1 : 0)
    }

    if (defaultRole === 'member') {
      return count + (memberRole === 'member' ? 1 : 0)
    }

    return count + (memberRole === 'viewer' ? 1 : 0)
  }, 0)
}

function buildDefaultAccessGroups(team: ITeam): ITeamAccessGroup[] {
  const now = new Date()

  return [
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      name: 'Platform Admins',
      description: 'Owners and administrators with full platform access.',
      members: getDefaultGroupMemberCount(team, 'admin'),
      permissions: 14,
      default_role: 'admin' as AccessGroupDefaultRole,
      created_at: now,
      updated_at: now
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      name: 'Security Team',
      description: 'Members responsible for security controls and investigations.',
      members: getDefaultGroupMemberCount(team, 'member'),
      permissions: 9,
      default_role: 'member' as AccessGroupDefaultRole,
      created_at: now,
      updated_at: now
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      name: 'Support',
      description: 'Support users with read access for incident triage.',
      members: getDefaultGroupMemberCount(team, 'viewer'),
      permissions: 6,
      default_role: 'viewer' as AccessGroupDefaultRole,
      created_at: now,
      updated_at: now
    }
  ]
}

function ensureTeamSettingsDefaults(team: ITeam) {
  const legacyTeam = team as unknown as TeamWithLegacySettings
  let changed = false

  if (!legacyTeam.settings || typeof legacyTeam.settings !== 'object') {
    legacyTeam.settings = {}
    changed = true
  }
  const settings = legacyTeam.settings

  if (!Array.isArray(settings.access_groups) || settings.access_groups.length === 0) {
    settings.access_groups = buildDefaultAccessGroups(team)
    changed = true
  }

  if (!settings.webhooks || typeof settings.webhooks !== 'object') {
    settings.webhooks = { events: [] }
    changed = true
  }
  const webhooks = settings.webhooks

  if (!Array.isArray(webhooks.events)) {
    webhooks.events = []
    changed = true
  } else {
    const normalizedEvents = normalizeWebhookEvents(webhooks.events)
    if (
      normalizedEvents.length !== webhooks.events.length ||
      normalizedEvents.some((event, index) => event !== webhooks.events?.[index])
    ) {
      webhooks.events = normalizedEvents
      changed = true
    }
  }

  if (!settings.auth_methods || typeof settings.auth_methods !== 'object') {
    settings.auth_methods = {
      magic_link: true,
      email_code: true
    }
    changed = true
  }
  const authMethods = settings.auth_methods

  if (typeof authMethods.magic_link !== 'boolean') {
    authMethods.magic_link = true
    changed = true
  }

  if (typeof authMethods.email_code !== 'boolean') {
    authMethods.email_code = true
    changed = true
  }

  if (!authMethods.magic_link && !authMethods.email_code) {
    authMethods.email_code = true
    changed = true
  }

  const retentionCandidate = Number.parseInt(String(settings.retention_days ?? ''), 10)
  const normalizedRetention = Number.isFinite(retentionCandidate)
    ? Math.min(365, Math.max(7, retentionCandidate))
    : 90

  if (settings.retention_days !== normalizedRetention) {
    settings.retention_days = normalizedRetention
    changed = true
  }

  if (typeof settings.require_2fa !== 'boolean') {
    settings.require_2fa = false
    changed = true
  }

  if (!settings.billing || typeof settings.billing !== 'object') {
    settings.billing = {
      auto_recharge: true,
      billing_interval: 'monthly',
      seat_count: 1
    }
    changed = true
  }

  return changed
}

/**
 * Create a new team
 */
export async function createTeam(data: {
  name: string
  slug: string
  description?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  if (!mongoose.isValidObjectId(session.user.id)) {
    throw new Error('Invalid user id')
  }
  const userObjectId = new mongoose.Types.ObjectId(session.user.id)

  await connectDB()

  const normalizedName = String(data.name || '').trim().slice(0, 80)
  if (!normalizedName) {
    throw new Error('Team name is required')
  }

  const slugValidation = validateTeamSlug(data.slug)
  if (!slugValidation.valid) {
    throw new Error(slugValidation.message || 'Team slug is invalid')
  }

  // Check if slug is available
  const existing = await Team.findOne({ slug: slugValidation.sanitized })
  if (existing) {
    throw new Error('Team slug already taken')
  }

  // Create team with user as owner
  const team = await Team.create({
    name: normalizedName,
    slug: slugValidation.sanitized,
    description: String(data.description || '').trim().slice(0, 200) || undefined,
    members: [{
      user_id: userObjectId,
      role: 'owner',
      joined_at: new Date()
    }],
    active: true
  })

  revalidatePath('/dashboard')
  return { success: true, team: JSON.parse(JSON.stringify(team.toObject())) }
}

/**
 * Get all teams for the current user
 */
export async function getUserTeams() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  if (!mongoose.isValidObjectId(session.user.id)) {
    throw new Error('Invalid user id')
  }

  await connectDB()

  const teams = await Team.findUserTeams(session.user.id)
  // Properly serialize to plain objects for client components
  const teamsObj = teams.map((team) => team.toObject())
  return JSON.parse(JSON.stringify(teamsObj))
}

/**
 * Get a specific team by slug
 */
export async function getTeam(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  // Decode URL-encoded parameters (e.g., %40me -> @me)
  const decodedSlug = decodeURIComponent(slug)
  
  let team
  
  if (decodedSlug === '@me' || decodedSlug.startsWith('@me-')) {
    // Look for user's personal team with user-specific slug
    const personalSlug = decodedSlug === '@me' ? `@me-${session.user.id}` : decodedSlug;
    team = await Team.findOne({
      slug: personalSlug
    })
    
    if (!team) {
      // Create personal team on-the-fly if it doesn't exist
      const displayName = session.user.name || session.user.email || 'User'
      const userObjectId = new mongoose.Types.ObjectId(session.user.id)
      
      team = await Team.create({
        name: `${displayName}'s Personal Team`,
        slug: personalSlug,
        description: 'Your personal team',
        members: [{
          user_id: userObjectId,
          role: 'owner',
          joined_at: new Date()
        }],
        active: true
      })
    }
  } else {
    const cleanSlug = decodedSlug.replace(/^@/, '')
    team = await Team.findBySlug(cleanSlug)
  }
  
  if (!team) {
    throw new Error('Team not found')
  }

  // Check if user is a member
  const isMember = team.members.some((member) => member.user_id.toString() === session.user.id)
  if (!isMember) {
    throw new Error('Access denied')
  }

  if (ensureTeamSettingsDefaults(team)) {
    team.updated_at = new Date()
    await team.save()
  }

  const memberIds = team.members.map((member) => member.user_id)
  const memberUsers = (await User.find({
      _id: { $in: memberIds }
    })
      .select('_id name email')
      .lean()) as TeamMemberUser[]

  const userMap = new Map(
    memberUsers.map((memberUser) => [memberUser._id.toString(), memberUser])
  )

  const now = new Date()
  const membersDetailed = team.members.map((member) => {
    const memberUser = userMap.get(member.user_id.toString())
    return {
      userId: member.user_id.toString(),
      name: memberUser?.name || memberUser?.email || 'Unknown Member',
      email: memberUser?.email || '',
      role: member.role,
      joinedAt: member.joined_at
    }
  })

  const pendingInvites = (team.invites || [])
    .filter((invite) => !invite.accepted && invite.expires_at > now)
    .map((invite) => ({
      email: invite.email,
      role: invite.role,
      invitedAt: invite.invited_at,
      expiresAt: invite.expires_at,
      token: invite.token
    }))

  // Properly serialize to plain object for client components
  const teamObj = team.toObject()
  if (teamObj?.settings?.webhooks && typeof teamObj.settings.webhooks.signing_secret === 'string') {
    const secret = String(teamObj.settings.webhooks.signing_secret)
    teamObj.settings.webhooks.signing_secret_masked = secret.length > 0 ? maskSecret(secret) : ''
    delete teamObj.settings.webhooks.signing_secret
  }
  const currentUserRoleKey = Team.getUserRole(team, session.user.id)
  const currentUserRole = currentUserRoleKey
    ? Team.getRoleDefinition(team, currentUserRoleKey)
    : null
  const serialized = {
    ...teamObj,
    membersDetailed,
    pendingInvites,
    roles: Team.listRoles(team),
    currentUserRoleKey,
    currentUserCapabilities: currentUserRole?.permissions || []
  }
  return JSON.parse(JSON.stringify(serialized))
}

/**
 * Update team details
 */
export async function updateTeam(
  slug: string,
  data: {
    name?: string
    description?: string
    avatar_url?: string
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check if user can manage team settings
  if (!hasCapabilityOrRole(team, session.user.id, 'team.settings.update', 'admin')) {
    throw new Error('Insufficient permissions')
  }

  if (data.name) team.name = data.name
  if (data.description !== undefined) team.description = data.description
  if (data.avatar_url !== undefined) team.avatar_url = data.avatar_url
  
  team.updated_at = new Date()
  await team.save()

  revalidatePath('/dashboard')
  return { success: true, team: JSON.parse(JSON.stringify(team.toObject())) }
}

export async function createAccessGroup(
  slug: string,
  data: {
    name: string
    description?: string
    defaultRole?: AccessGroupDefaultRole
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!hasCapabilityOrRole(team, session.user.id, 'team.settings.update', 'admin')) {
    throw new Error('Insufficient permissions')
  }

  ensureTeamSettingsDefaults(team)

  const normalizedName = String(data?.name || '').trim().slice(0, 64)
  if (!normalizedName) {
    throw new Error('Access group name is required')
  }

  const existingGroups = Array.isArray(team.settings.access_groups)
    ? team.settings.access_groups
    : []

  const duplicate = existingGroups.some(
    (group) => String(group.name || '').trim().toLowerCase() === normalizedName.toLowerCase()
  )
  if (duplicate) {
    throw new Error('Access group already exists')
  }

  const defaultRole = normalizeAccessRole(data?.defaultRole)
  const description = String(data?.description || '').trim().slice(0, 160)
  const now = new Date()
  const permissions = defaultRole === 'admin' ? 12 : defaultRole === 'member' ? 8 : 4
  const nextGroup = {
    id: new mongoose.Types.ObjectId().toHexString(),
    name: normalizedName,
    description: description || 'Custom access group for team permission routing.',
    members: getDefaultGroupMemberCount(team, defaultRole),
    permissions,
    default_role: defaultRole,
    created_at: now,
    updated_at: now
  }

  team.settings.access_groups = [...existingGroups, nextGroup]
  team.updated_at = now
  await team.save()

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath('/account/settings')

  return {
    success: true,
    group: JSON.parse(JSON.stringify(nextGroup)),
    accessGroups: JSON.parse(JSON.stringify(team.settings.access_groups))
  }
}

export async function updateTeamWebhookSettings(
  slug: string,
  data: {
    url: string
    secret: string
    events: string[]
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  const canManageWebhooks =
    hasCapabilityOrRole(team, session.user.id, 'integrations.manage', 'admin') ||
    hasCapabilityOrRole(team, session.user.id, 'security.manage', 'admin')
  if (!canManageWebhooks) {
    throw new Error('Insufficient permissions')
  }

  const normalizedUrl = String(data?.url || '').trim()
  if (!isValidHttpUrl(normalizedUrl)) {
    throw new Error('Webhook URL is invalid')
  }

  const normalizedSecret = String(data?.secret || '').trim()
  if (normalizedSecret.length < 8) {
    throw new Error('Webhook signing secret must be at least 8 characters')
  }

  const events = normalizeWebhookEvents(data?.events)
  if (events.length === 0) {
    throw new Error('At least one webhook event is required')
  }

  ensureTeamSettingsDefaults(team)

  const now = new Date()
  team.settings.webhooks.endpoint_url = normalizedUrl
  team.settings.webhooks.signing_secret = normalizedSecret
  team.settings.webhooks.events = events
  team.settings.webhooks.updated_at = now
  if (mongoose.isValidObjectId(session.user.id)) {
    team.settings.webhooks.updated_by = new mongoose.Types.ObjectId(session.user.id)
  }

  team.updated_at = now
  await team.save()

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath('/account/settings')

  return {
    success: true,
    webhook: {
      url: normalizedUrl,
      secretMasked: maskSecret(normalizedSecret),
      events,
      updatedAt: now.toISOString()
    }
  }
}

export async function updateTeamSecuritySettings(
  slug: string,
  data: {
    require2FA: boolean
    allowMagicLink: boolean
    allowEmailCode: boolean
    retentionDays: number
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  const canManageSecurity =
    hasCapabilityOrRole(team, session.user.id, 'security.manage', 'admin') ||
    hasCapabilityOrRole(team, session.user.id, 'team.settings.update', 'admin')
  if (!canManageSecurity) {
    throw new Error('Insufficient permissions')
  }

  const allowMagicLink = Boolean(data?.allowMagicLink)
  const allowEmailCode = Boolean(data?.allowEmailCode)
  if (!allowMagicLink && !allowEmailCode) {
    throw new Error('At least one authentication method must remain enabled')
  }

  const parsedRetention = Number.parseInt(String(data?.retentionDays ?? ''), 10)
  const normalizedRetention = Number.isFinite(parsedRetention)
    ? Math.min(365, Math.max(7, parsedRetention))
    : 90

  ensureTeamSettingsDefaults(team)

  team.settings.require_2fa = Boolean(data?.require2FA)
  team.settings.auth_methods.magic_link = allowMagicLink
  team.settings.auth_methods.email_code = allowEmailCode
  team.settings.retention_days = normalizedRetention
  team.updated_at = new Date()
  await team.save()

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath('/account/settings')

  return {
    success: true,
    security: {
      require2FA: team.settings.require_2fa,
      allowMagicLink: team.settings.auth_methods.magic_link,
      allowEmailCode: team.settings.auth_methods.email_code,
      retentionDays: team.settings.retention_days
    }
  }
}

/**
 * Invite a user to the team
 */
export async function inviteToTeam(
  slug: string,
  email: string,
  role: TeamAssignableRole = 'member'
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check permissions
  if (!hasCapabilityOrRole(team, session.user.id, 'members.invite', 'admin')) {
    throw new Error('Insufficient permissions')
  }

  if (!team.can_add_member) {
    throw new Error(`Member limit reached (${team.max_members} max)`)
  }

  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Invalid email address')
  }

  const normalizedRole = String(role || 'member').trim().toLowerCase()
  const token = await team.createInvite(normalizedEmail, normalizedRole, session.user.id)

  const inviteLink = `${APP_URL}/invite/${token}`

  await sendTeamInviteEmail({
    to: normalizedEmail,
    inviteLink,
    teamName: team.name,
    roleName: normalizedRole,
    invitedByName: session.user.name || session.user.email || 'A team admin',
    appName: 'NetGoat'
  })

  revalidatePath(`/dashboard/${slug}`)
  return { success: true, inviteLink, token, emailSent: true }
}

/**
 * Accept team invite
 */
export async function acceptInvite(token: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id || !session.user.email) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findByInviteToken(token)
  if (!team) {
    throw new Error('Invalid or expired invite')
  }

  const invite = team.invites.find((invite) => invite.token === token)
  if (
    !invite ||
    invite.email.toLowerCase() !== String(session.user.email).toLowerCase()
  ) {
    throw new Error('Invite not found or email mismatch')
  }

  // Add user to team
  await team.addMember(session.user.id, invite.role)

  // Mark invite as accepted
  invite.accepted = true
  team.updated_at = new Date()
  await team.save()

  revalidatePath('/dashboard')
  return { success: true, teamSlug: team.slug }
}

/**
 * Remove a member from the team
 */
export async function removeMember(slug: string, userId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check permissions
  if (!hasCapabilityOrRole(team, session.user.id, 'members.remove', 'admin')) {
    throw new Error('Insufficient permissions')
  }

  await team.removeMember(userId)

  revalidatePath(`/dashboard/${slug}`)
  return { success: true }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  slug: string,
  userId: string,
  role: TeamAssignableRole
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check permissions - only owner can change roles
  if (!hasCapabilityOrRole(team, session.user.id, 'members.role.update', 'owner')) {
    throw new Error('Only team owner or role manager can change roles')
  }

  const normalizedRole = String(role || '').trim().toLowerCase()
  await team.updateMemberRole(userId, normalizedRole)

  revalidatePath(`/dashboard/${slug}`)
  return { success: true }
}

/**
 * Get all role definitions (presets + custom roles) for a team
 */
export async function listTeamRoles(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Access denied')
  }

  return JSON.parse(JSON.stringify(Team.listRoles(team)))
}

/**
 * Create a custom role for a team
 */
export async function createTeamRole(
  slug: string,
  data: {
    key?: string
    name: string
    description?: string
    inherits: TeamRoleInheritance
    permissions?: TeamCapability[]
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!hasCapabilityOrRole(team, session.user.id, 'roles.manage', 'owner')) {
    throw new Error('Only team owner or role manager can create roles')
  }

  const role = await team.createCustomRole(data)

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath('/account/settings')
  return {
    success: true,
    role: JSON.parse(JSON.stringify(role)),
    roles: JSON.parse(JSON.stringify(Team.listRoles(team)))
  }
}

/**
 * Delete a custom role from a team
 */
export async function removeTeamRole(slug: string, roleKey: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!hasCapabilityOrRole(team, session.user.id, 'roles.manage', 'owner')) {
    throw new Error('Only team owner or role manager can delete roles')
  }

  await team.removeCustomRole(roleKey)

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath('/account/settings')
  return {
    success: true,
    roles: JSON.parse(JSON.stringify(Team.listRoles(team)))
  }
}

/**
 * Leave team
 */
export async function leaveTeam(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  const member = team.members.find((member) => member.user_id.toString() === session.user.id)
  if (!member) {
    throw new Error('Not a member of this team')
  }

  if (member.role === 'owner') {
    throw new Error('Team owner cannot leave. Transfer ownership or delete the team.')
  }

  await team.removeMember(session.user.id)

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Delete team (owner only)
 */
export async function deleteTeam(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check if owner
  if (!Team.hasPermission(team, session.user.id, 'owner')) {
    throw new Error('Only team owner can delete the team')
  }

  // Soft delete
  team.active = false
  team.updated_at = new Date()
  await team.save()

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Get team statistics
 */
export async function getTeamStats(slug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(slug)
  if (!team) {
    throw new Error('Team not found')
  }

  // Check if user is a member
  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Access denied')
  }

  return {
    total_requests: team.total_requests,
    total_blocked: team.total_blocked,
    total_bandwidth: team.total_bandwidth,
    domain_count: team.domain_count,
    member_count: team.members.length,
    plan: team.plan
  }
}
