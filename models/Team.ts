import mongoose, { Schema, model, models, Model, Document } from 'mongoose'

export interface ITeamMember {
  user_id: mongoose.Types.ObjectId
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: Date
}

export interface ITeamInvite {
  email: string
  role: 'admin' | 'member' | 'viewer'
  invited_by: mongoose.Types.ObjectId
  invited_at: Date
  expires_at: Date
  token: string
  accepted: boolean
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
  addMember(userId: string, role?: 'admin' | 'member' | 'viewer'): Promise<void>
  removeMember(userId: string): Promise<void>
  updateMemberRole(userId: string, newRole: 'admin' | 'member' | 'viewer'): Promise<void>
  createInvite(email: string, role: 'admin' | 'member' | 'viewer', invitedBy: string): Promise<string>
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  joined_at: { type: Date, default: Date.now }
})

const TeamInviteSchema = new Schema<ITeamInvite>({
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  invited_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  invited_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  token: { type: String, required: true },
  accepted: { type: Boolean, default: false }
})

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  avatar_url: { type: String },
  
  members: [TeamMemberSchema],
  invites: [TeamInviteSchema],
  
  max_domains: { type: Number, default: 5 },
  max_members: { type: Number, default: 5 },
  domain_count: { type: Number, default: 0 },
  
  total_requests: { type: Number, default: 0 },
  total_blocked: { type: Number, default: 0 },
  total_bandwidth: { type: Number, default: 0 },
  
  settings: {
    allow_member_invites: { type: Boolean, default: false },
    require_2fa: { type: Boolean, default: false },
    ip_whitelist: [{ type: String }]
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
TeamSchema.methods.addMember = async function(userId: string, role: 'admin' | 'member' | 'viewer' = 'member') {
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
    role,
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

TeamSchema.methods.updateMemberRole = async function(userId: string, newRole: 'admin' | 'member' | 'viewer') {
  const member = this.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  if (!member) {
    throw new Error('Member not found')
  }
  
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role')
  }
  
  member.role = newRole
  this.updated_at = new Date()
  await this.save()
}

TeamSchema.methods.createInvite = async function(email: string, role: 'admin' | 'member' | 'viewer', invitedBy: string) {
  // Generate unique token
  const token = require('crypto').randomBytes(32).toString('hex')
  
  // Remove existing invites for this email
  this.invites = this.invites.filter((i: ITeamInvite) => i.email !== email)
  
  // Create new invite
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry
  
  this.invites.push({
    email,
    role,
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

TeamSchema.statics.hasPermission = function(team: ITeam, userId: string, requiredRole: 'owner' | 'admin' | 'member' | 'viewer') {
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 }
  const member = team.members.find((m: ITeamMember) => m.user_id.toString() === userId)
  const userRole = member?.role || null
  
  if (!userRole) return false
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Model interface with static methods
interface ITeamModel extends Model<ITeam> {
  findBySlug(slug: string): Promise<ITeam | null>
  findUserTeams(userId: string): Promise<ITeam[]>
  findByInviteToken(token: string): Promise<ITeam | null>
  getUserRole(team: ITeam, userId: string): string | null
  hasPermission(team: ITeam, userId: string, requiredRole: 'owner' | 'admin' | 'member' | 'viewer'): boolean
}

export const Team = (models.Team || model<ITeam, ITeamModel>('Team', TeamSchema)) as ITeamModel

export default Team
