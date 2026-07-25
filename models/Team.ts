import crypto from 'crypto'
import mongoose, { Schema, model, models, Model, Document } from 'mongoose'

export type TeamBuiltinRole =
  | 'owner'
  | 'admin'
  | 'billing_manager'
  | 'member'
  | 'viewer'
export type TeamRoleInheritance = Exclude<TeamBuiltinRole, 'owner'>

export const TEAM_CAPABILITIES = [
  'team.view',
  'team.settings.update',
  'members.view',
  'members.invite',
  'members.role.update',
  'members.remove',
  'roles.manage',
  'billing.view',
  'billing.manage',
  'invoices.view',
  'invoices.manage',
  'domains.view',
  'domains.manage',
  'integrations.manage',
  'security.manage'
] as const

export type TeamCapability = (typeof TEAM_CAPABILITIES)[number]

export interface IResolvedTeamRole {
  key: string
  name: string
  description: string
  inherits: TeamBuiltinRole | TeamRoleInheritance
  permissions: string[]
  isPreset: boolean
}

const ROLE_PERMISSION_MATRIX: Record<
  TeamBuiltinRole,
  Array<'owner' | 'admin' | 'member' | 'viewer'>
> = {
  owner: ['owner', 'admin', 'member', 'viewer'],
  admin: ['admin', 'member', 'viewer'],
  billing_manager: ['viewer'],
  member: ['member', 'viewer'],
  viewer: ['viewer']
}

const BUILTIN_ROLE_CAPABILITIES: Record<TeamBuiltinRole, string[]> = {
  owner: ['*'],
  admin: [
    'team.view',
    'team.settings.update',
    'members.view',
    'members.invite',
    'members.role.update',
    'members.remove',
    'roles.manage',
    'billing.view',
    'billing.manage',
    'invoices.view',
    'invoices.manage',
    'domains.view',
    'domains.manage',
    'integrations.manage',
    'security.manage'
  ],
  billing_manager: [
    'team.view',
    'members.view',
    'billing.view',
    'billing.manage',
    'invoices.view',
    'invoices.manage'
  ],
  member: [
    'team.view',
    'members.view',
    'domains.view',
    'domains.manage',
    'integrations.manage',
    'invoices.view'
  ],
  viewer: ['team.view', 'members.view', 'domains.view', 'billing.view', 'invoices.view']
}

const BUILTIN_ROLE_META: Record<
  TeamBuiltinRole,
  { name: string; description: string; inherits: TeamBuiltinRole | TeamRoleInheritance }
> = {
  owner: {
    name: 'Owner',
    description: 'Full access to all team resources and role administration.',
    inherits: 'owner'
  },
  admin: {
    name: 'Admin',
    description: 'Manage team settings, members, billing, and infrastructure resources.',
    inherits: 'admin'
  },
  billing_manager: {
    name: 'Billing Manager',
    description: 'Manage billing contacts, invoices, and payment operations.',
    inherits: 'billing_manager'
  },
  member: {
    name: 'Member',
    description: 'Standard collaborator access for day-to-day workspace operations.',
    inherits: 'member'
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to team resources and billing overviews.',
    inherits: 'viewer'
  }
}

function normalizeRoleKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
}

function roleKeyFromName(name: string) {
  return normalizeRoleKey(name).replace(/^_+|_+$/g, '').slice(0, 40)
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isBuiltinRole(value: string): value is TeamBuiltinRole {
  return value in ROLE_PERMISSION_MATRIX
}

function isRoleInheritance(value: string): value is TeamRoleInheritance {
  return value === 'admin' || value === 'billing_manager' || value === 'member' || value === 'viewer'
}

function toUniqueCapabilities(input: unknown): TeamCapability[] {
  if (!Array.isArray(input)) return []
  const allowed = new Set<TeamCapability>(TEAM_CAPABILITIES)
  const values: TeamCapability[] = []

  for (const item of input) {
    const normalized = String(item || '').trim() as TeamCapability
    if (allowed.has(normalized) && !values.includes(normalized)) {
      values.push(normalized)
    }
  }

  return values
}

function resolveInheritedCapabilities(inherits: TeamBuiltinRole | TeamRoleInheritance) {
  return [...BUILTIN_ROLE_CAPABILITIES[inherits]]
}

export interface ITeamMember {
  user_id: mongoose.Types.ObjectId
  role: string
  joined_at: Date
}

export interface ITeamInvite {
  email: string
  role: string
  invited_by: mongoose.Types.ObjectId
  invited_at: Date
  expires_at: Date
  token: string
  accepted: boolean
}

export interface ITeamCustomRole {
  key: string
  name: string
  description?: string
  inherits: TeamRoleInheritance
  permissions: TeamCapability[]
  created_at: Date
}

export interface ITeamAccessGroup {
  id: string
  name: string
  description: string
  members: number
  permissions: number
  default_role: 'viewer' | 'member' | 'admin'
  created_at: Date
  updated_at: Date
}

export interface ITeamWebhookSettings {
  endpoint_url?: string
  signing_secret?: string
  events: string[]
  updated_at?: Date
  updated_by?: mongoose.Types.ObjectId
}

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  avatar_url?: string
  
  // Members
  members: ITeamMember[]
  invites: ITeamInvite[]
  custom_roles: ITeamCustomRole[]
  
  // Quotas & Limits
  max_domains: number
  max_members: number
  domain_count: number
  
  // Statistics
  total_requests: number
  total_blocked: number
  total_bandwidth: number
  
  // Settings
  settings: {
    allow_member_invites: boolean
    require_2fa: boolean
    ip_whitelist: string[]
    access_groups: ITeamAccessGroup[]
    webhooks: ITeamWebhookSettings
    auth_methods: {
      magic_link: boolean
      email_code: boolean
    }
    retention_days: number
    billing: {
      auto_recharge: boolean
      invoice_email?: string
      po_number?: string
      billing_interval?: 'monthly' | 'annual'
      seat_count?: number
    }
  }
  
  // Billing
  plan: 'free' | 'pro' | 'enterprise'
  subscription_id?: string
  billing_email?: string
  
  // Metadata
  active: boolean
  created_at: Date
  updated_at: Date
  
  // Virtuals
  can_add_domain: boolean
  can_add_member: boolean
  
  // Instance Methods
  addMember(userId: string, role?: string): Promise<void>
  removeMember(userId: string): Promise<void>
  updateMemberRole(userId: string, newRole: string): Promise<void>
  createInvite(email: string, role: string, invitedBy: string): Promise<string>
  createCustomRole(role: {
    key?: string
    name: string
    description?: string
    inherits: TeamRoleInheritance
    permissions?: TeamCapability[]
  }): Promise<ITeamCustomRole>
  removeCustomRole(roleKey: string): Promise<void>
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'member' },
  joined_at: { type: Date, default: Date.now }
})

const TeamInviteSchema = new Schema<ITeamInvite>({
  email: { type: String, required: true },
  role: { type: String, default: 'member' },
  invited_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invited_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  token: { type: String, required: true },
  accepted: { type: Boolean, default: false }
})

const TeamCustomRoleSchema = new Schema<ITeamCustomRole>({
  key: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  inherits: {
    type: String,
    enum: ['admin', 'billing_manager', 'member', 'viewer'],
    default: 'member'
  },
  permissions: [{ type: String, enum: TEAM_CAPABILITIES }],
  created_at: { type: Date, default: Date.now }
})

const TeamAccessGroupSchema = new Schema<ITeamAccessGroup>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    members: { type: Number, min: 0, default: 0 },
    permissions: { type: Number, min: 0, default: 0 },
    default_role: {
      type: String,
      enum: ['viewer', 'member', 'admin'],
      default: 'viewer'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { _id: false }
)

const TeamWebhookSettingsSchema = new Schema<ITeamWebhookSettings>(
  {
    endpoint_url: { type: String },
    signing_secret: { type: String },
    events: { type: [String], default: [] },
    updated_at: { type: Date },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
)

const TeamSchema = new Schema<ITeam, ITeamModel, ITeam>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  avatar_url: { type: String },
  
  members: [TeamMemberSchema],
  invites: [TeamInviteSchema],
  custom_roles: {
    type: [TeamCustomRoleSchema],
    default: []
  },
  
  max_domains: { type: Number, default: 5 },
  max_members: { type: Number, default: 5 },
  domain_count: { type: Number, default: 0 },
  
  total_requests: { type: Number, default: 0 },
  total_blocked: { type: Number, default: 0 },
  total_bandwidth: { type: Number, default: 0 },
  
  settings: {
    allow_member_invites: { type: Boolean, default: false },
    require_2fa: { type: Boolean, default: false },
    ip_whitelist: [{ type: String }],
    access_groups: {
      type: [TeamAccessGroupSchema],
      default: []
    },
    webhooks: {
      type: TeamWebhookSettingsSchema,
      default: () => ({ events: [] })
    },
    auth_methods: {
      magic_link: { type: Boolean, default: true },
      email_code: { type: Boolean, default: true }
    },
    retention_days: { type: Number, min: 7, max: 365, default: 90 },
    billing: {
      auto_recharge: { type: Boolean, default: true },
      invoice_email: { type: String },
      po_number: { type: String },
      billing_interval: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
      seat_count: { type: Number, min: 1, default: 1 }
    }
  },
  
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  subscription_id: { type: String },
  billing_email: { type: String },
  
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Indexes (slug already has a unique index from schema definition)
TeamSchema.index({ 'members.user_id': 1 })
TeamSchema.index({ 'invites.email': 1 })
TeamSchema.index({ 'invites.token': 1 }, { unique: true, sparse: true })

// Virtuals
TeamSchema.virtual('can_add_domain').get(function() {
  return this.domain_count < this.max_domains
})

TeamSchema.virtual('can_add_member').get(function() {
  return this.members.length < this.max_members
})

// Instance Methods
TeamSchema.methods.addMember = async function(userId: string, role: string = 'member') {
  const normalizedRole = normalizeRoleKey(role)
  const TeamModel = this.constructor as ITeamModel

  if (!TeamModel.roleExists(this, normalizedRole)) {
    throw new Error('Invalid team role')
  }

  if (!this.can_add_member) {
    throw new Error(`Member limit reached (${this.max_members} max)`)
  }
  
  // Check if already a member
  const exists = this.members.some((m: ITeamMember) => m.user_id.toString() === userId)
  if (exists) {
    throw new Error('User is already a member')
  }
  
  this.members.push({
    user_id: new mongoose.Types.ObjectId(userId),
    role: normalizedRole,
    joined_at: new Date()
  })
  
  this.updated_at = new Date()
  await this.save()
}

TeamSchema.methods.removeMember = async function(userId: string) {
  const member = this.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  if (!member) {
    throw new Error('Member not found')
  }
  
  if (member.role === 'owner') {
    throw new Error('Cannot remove team owner')
  }
  
  this.members = this.members.filter((m: ITeamMember) => m.user_id.toString() !== userId)
  this.updated_at = new Date()
  await this.save()
}

TeamSchema.methods.updateMemberRole = async function(userId: string, newRole: string) {
  const normalizedRole = normalizeRoleKey(newRole)
  const TeamModel = this.constructor as ITeamModel

  if (!TeamModel.roleExists(this, normalizedRole)) {
    throw new Error('Invalid team role')
  }

  if (normalizedRole === 'owner') {
    throw new Error('Owner role cannot be assigned')
  }

  const member = this.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  if (!member) {
    throw new Error('Member not found')
  }
  
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role')
  }
  
  member.role = normalizedRole
  this.updated_at = new Date()
  await this.save()
}

TeamSchema.methods.createInvite = async function(email: string, role: string, invitedBy: string) {
  const normalizedRole = normalizeRoleKey(role)
  const normalizedEmail = normalizeEmail(email)
  const TeamModel = this.constructor as ITeamModel

  if (!TeamModel.roleExists(this, normalizedRole)) {
    throw new Error('Invalid team role')
  }

  if (normalizedRole === 'owner') {
    throw new Error('Owner role cannot be assigned by invite')
  }

  // Generate unique token
  const token = crypto.randomBytes(32).toString('hex')
  
  // Remove existing invites for this email
  this.invites = this.invites.filter(
    (i: ITeamInvite) => normalizeEmail(i.email) !== normalizedEmail
  )
  
  // Create new invite
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry
  
  this.invites.push({
    email: normalizedEmail,
    role: normalizedRole,
    invited_by: new mongoose.Types.ObjectId(invitedBy),
    invited_at: new Date(),
    expires_at: expiresAt,
    token,
    accepted: false
  })
  
  this.updated_at = new Date()
  await this.save()
  
  return token
}

  TeamSchema.methods.createCustomRole = async function(role: {
    key?: string
    name: string
    description?: string
    inherits: TeamRoleInheritance
    permissions?: TeamCapability[]
  }) {
    const TeamModel = this.constructor as ITeamModel
    const normalizedName = String(role.name || '').trim()
    if (!normalizedName) {
      throw new Error('Role name is required')
    }

    const rawKey = String(role.key || normalizedName)
    const normalizedKey = roleKeyFromName(rawKey)
    if (!normalizedKey) {
      throw new Error('Role key is invalid')
    }

    if (isBuiltinRole(normalizedKey)) {
      throw new Error('Cannot overwrite a built-in role')
    }

    if (this.custom_roles.length >= 25) {
      throw new Error('Custom role limit reached (25 max)')
    }

    if (TeamModel.roleExists(this, normalizedKey)) {
      throw new Error('Role key already exists')
    }

    if (!isRoleInheritance(role.inherits)) {
      throw new Error('Invalid role inheritance')
    }

    const normalizedPermissions = toUniqueCapabilities(role.permissions)
    const customRole: ITeamCustomRole = {
      key: normalizedKey,
      name: normalizedName,
      description: role.description?.trim(),
      inherits: role.inherits,
      permissions: normalizedPermissions,
      created_at: new Date()
    }

    this.custom_roles.push(customRole)
    this.updated_at = new Date()
    await this.save()

    return customRole
  }

  TeamSchema.methods.removeCustomRole = async function(roleKey: string) {
    const normalizedRoleKey = normalizeRoleKey(roleKey)
    if (isBuiltinRole(normalizedRoleKey)) {
      throw new Error('Built-in roles cannot be removed')
    }

    const exists = this.custom_roles.some((role: ITeamCustomRole) => role.key === normalizedRoleKey)
    if (!exists) {
      throw new Error('Custom role not found')
    }

    const hasMembers = this.members.some(
      (member: ITeamMember) => normalizeRoleKey(member.role) === normalizedRoleKey
    )
    if (hasMembers) {
      throw new Error('Cannot remove a role assigned to existing members')
    }

    const hasPendingInvites = this.invites.some(
      (invite: ITeamInvite) =>
        normalizeRoleKey(invite.role) === normalizedRoleKey &&
        !invite.accepted &&
        invite.expires_at > new Date()
    )
    if (hasPendingInvites) {
      throw new Error('Cannot remove a role assigned to pending invites')
    }

    this.custom_roles = this.custom_roles.filter(
      (role: ITeamCustomRole) => role.key !== normalizedRoleKey
    )
    this.updated_at = new Date()
    await this.save()
  }

// Static Methods
TeamSchema.statics.findBySlug = async function(slug: string) {
  return this.findOne({ slug, active: true })
}

TeamSchema.statics.findUserTeams = async function(userId: string) {
  return this.find({ 
    'members.user_id': new mongoose.Types.ObjectId(userId),
    active: true 
  }).sort({ created_at: -1 })
}

TeamSchema.statics.findByInviteToken = async function(token: string) {
  return this.findOne({ 
    'invites.token': token,
    'invites.accepted': false,
    'invites.expires_at': { $gt: new Date() }
  })
}

TeamSchema.statics.getUserRole = function(team: ITeam, userId: string) {
  const member = team.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  return member?.role || null
}

TeamSchema.statics.listRoles = function(team: ITeam): IResolvedTeamRole[] {
  const presets = (Object.keys(BUILTIN_ROLE_META) as TeamBuiltinRole[]).map((roleKey) => ({
    key: roleKey,
    name: BUILTIN_ROLE_META[roleKey].name,
    description: BUILTIN_ROLE_META[roleKey].description,
    inherits: BUILTIN_ROLE_META[roleKey].inherits,
    permissions: [...BUILTIN_ROLE_CAPABILITIES[roleKey]],
    isPreset: true
  }))

  const custom = (team.custom_roles || []).map((role) => {
    const inheritedCapabilities = resolveInheritedCapabilities(role.inherits)
    const mergedPermissions = [...new Set([...inheritedCapabilities, ...role.permissions])]

    return {
      key: role.key,
      name: role.name,
      description:
        role.description?.trim() ||
        `Custom role inheriting ${BUILTIN_ROLE_META[role.inherits].name} permissions.`,
      inherits: role.inherits,
      permissions: mergedPermissions,
      isPreset: false
    }
  })

  return [...presets, ...custom]
}

TeamSchema.statics.getRoleDefinition = function(team: ITeam, roleKey: string) {
  const normalizedRole = normalizeRoleKey(roleKey)
  return this.listRoles(team).find((role: IResolvedTeamRole) => role.key === normalizedRole) || null
}

TeamSchema.statics.roleExists = function(team: ITeam, roleKey: string) {
  return Boolean(this.getRoleDefinition(team, roleKey))
}

TeamSchema.statics.hasCapability = function(team: ITeam, userId: string, capability: TeamCapability) {
  const member = team.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  if (!member) return false

  const role = this.getRoleDefinition(team, member.role)
  if (!role) return false

  if (role.permissions.includes('*')) {
    return true
  }

  return role.permissions.includes(capability)
}

TeamSchema.statics.hasPermission = function(team: ITeam, userId: string, requiredRole: 'owner' | 'admin' | 'member' | 'viewer') {
  const member = team.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  if (!member?.role) return false

  const role = this.getRoleDefinition(team, member.role)
  if (!role) return false

  const baseRole = isBuiltinRole(role.key)
    ? role.key
    : isBuiltinRole(role.inherits)
      ? role.inherits
      : null

  if (!baseRole) return false

  return ROLE_PERMISSION_MATRIX[baseRole].includes(requiredRole)
}

// Model interface with static methods
interface ITeamModel extends Model<ITeam> {
  findBySlug(slug: string): Promise<ITeam | null>
  findUserTeams(userId: string): Promise<ITeam[]>
  findByInviteToken(token: string): Promise<ITeam | null>
  getUserRole(team: ITeam, userId: string): string | null
  listRoles(team: ITeam): IResolvedTeamRole[]
  getRoleDefinition(team: ITeam, roleKey: string): IResolvedTeamRole | null
  roleExists(team: ITeam, roleKey: string): boolean
  hasCapability(team: ITeam, userId: string, capability: TeamCapability): boolean
  hasPermission(team: ITeam, userId: string, requiredRole: 'owner' | 'admin' | 'member' | 'viewer'): boolean
}

export const Team = (models.Team || model<ITeam, ITeamModel>('Team', TeamSchema)) as ITeamModel

export default Team
