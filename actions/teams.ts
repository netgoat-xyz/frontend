'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import { Team } from '@/models/Team'
import User from '@/models/User'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'

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

  // Check if slug is available
  const existing = await Team.findOne({ slug: data.slug })
  if (existing) {
    throw new Error('Team slug already taken')
  }

  // Create team with user as owner
  const team = await Team.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
    members: [{
      user_id: userObjectId,
      role: 'owner',
      joined_at: new Date()
    }],
    active: true
  })

  revalidatePath('/dashboard')
  return { success: true, team: team.toObject() }
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
  const userObjectId = new mongoose.Types.ObjectId(session.user.id)

  await connectDB()

  const teams = await Team.findUserTeams(session.user.id)
  // Properly serialize to plain objects for client components
  const teamsObj = teams.map((t: any) => t.toObject())
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
  const isMember = team.members.some((m: any) => m.user_id.toString() === session.user.id)
  if (!isMember) {
    throw new Error('Access denied')
  }

  // Properly serialize to plain object for client components
  const teamObj = team.toObject()
  return JSON.parse(JSON.stringify(teamObj))
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

  // Check if user is admin or owner
  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  if (data.name) team.name = data.name
  if (data.description !== undefined) team.description = data.description
  if (data.avatar_url !== undefined) team.avatar_url = data.avatar_url
  
  team.updated_at = new Date()
  await team.save()

  revalidatePath('/dashboard')
  return { success: true, team: team.toObject() }
}

/**
 * Invite a user to the team
 */
export async function inviteToTeam(
  slug: string,
  email: string,
  role: 'admin' | 'member' | 'viewer' = 'member'
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
  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  if (!team.can_add_member) {
    throw new Error(`Member limit reached (${team.max_members} max)`)
  }

  const token = await team.createInvite(email, role, session.user.id)

  // In production, send email with invite link
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  revalidatePath(`/dashboard/${slug}`)
  return { success: true, inviteLink, token }
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

  const invite = team.invites.find((i: any) => i.token === token)
  if (!invite || invite.email !== session.user.email) {
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
  if (!Team.hasPermission(team, session.user.id, 'admin')) {
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
  role: 'admin' | 'member' | 'viewer'
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
  if (!Team.hasPermission(team, session.user.id, 'owner')) {
    throw new Error('Only team owner can change roles')
  }

  await team.updateMemberRole(userId, role)

  revalidatePath(`/dashboard/${slug}`)
  return { success: true }
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

  const member = team.members.find((m: any) => m.user_id.toString() === session.user.id)
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
