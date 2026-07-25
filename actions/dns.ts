'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import DNSRecord from '@/models/DNSRecord'
import type { IDNSRecord } from '@/models/DNSRecord'
import { Team } from '@/models/Team'
import Domain from '@/models/Domain'
import { revalidatePath } from 'next/cache'

type DNSRecordDocument = IDNSRecord & {
  toObject(): IDNSRecord
}

function toPlainDNSRecord(record: IDNSRecord) {
  return (record as DNSRecordDocument).toObject()
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return String(error)
}

/**
 * Create a DNS record for a domain
 */
export async function createDNSRecord(
  teamSlug: string,
  data: {
    domain_id: string
    domain: string
    type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
    name: string
    value: string
    ttl?: number
    priority?: number
    proxied?: boolean
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  // Verify domain belongs to team
  const domain = await Domain.findOne({
    _id: data.domain_id,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  // Validate DNS record value
  if (!DNSRecord.validateRecord(data.type, data.value)) {
    throw new Error(`Invalid ${data.type} record value`)
  }

  const record = await DNSRecord.create({
    team_id: team._id,
    domain_id: data.domain_id,
    domain: data.domain,
    type: data.type,
    name: data.name,
    value: data.value,
    ttl: data.ttl || 3600,
    priority: data.priority,
    proxied: data.proxied || false,
    active: true,
    propagated: false,
    created_by: session.user.id
  })

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true, record: record.toObject() }
}

/**
 * List all DNS records for a domain
 */
export async function listDNSRecords(teamSlug: string, domainId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Insufficient permissions')
  }

  // Verify domain belongs to team
  const domain = await Domain.findOne({
    _id: domainId,
    team_id: team._id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  const records = await DNSRecord.findByDomainId(domainId)
  return records.map(toPlainDNSRecord)
}

/**
 * List all DNS records for a team
 */
export async function listAllTeamDNS(teamSlug: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Insufficient permissions')
  }

  const records = await DNSRecord.findByTeam(team._id.toString())
  return records.map(toPlainDNSRecord)
}

/**
 * Update a DNS record
 */
export async function updateDNSRecord(
  teamSlug: string,
  recordId: string,
  data: {
    name?: string
    value?: string
    ttl?: number
    priority?: number
    proxied?: boolean
    active?: boolean
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'member')) {
    throw new Error('Insufficient permissions')
  }

  const record = await DNSRecord.findOne({
    _id: recordId,
    team_id: team._id
  })

  if (!record) {
    throw new Error('DNS record not found')
  }

  // Validate new value if provided
  if (data.value && !DNSRecord.validateRecord(record.type, data.value)) {
    throw new Error(`Invalid ${record.type} record value`)
  }

  if (data.name !== undefined) record.name = data.name
  if (data.value !== undefined) record.value = data.value
  if (data.ttl !== undefined) record.ttl = data.ttl
  if (data.priority !== undefined) record.priority = data.priority
  if (data.proxied !== undefined) record.proxied = data.proxied
  if (data.active !== undefined) record.active = data.active

  record.updated_at = new Date()
  record.propagated = false // Reset propagation status on update
  
  await record.save()

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true, record: record.toObject() }
}

/**
 * Delete a DNS record
 */
export async function deleteDNSRecord(teamSlug: string, recordId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'admin')) {
    throw new Error('Insufficient permissions')
  }

  const record = await DNSRecord.findOne({
    _id: recordId,
    team_id: team._id
  })

  if (!record) {
    throw new Error('DNS record not found')
  }

  await DNSRecord.deleteOne({ _id: recordId })

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true }
}

/**
 * Check DNS propagation status
 */
export async function checkDNSPropagation(teamSlug: string, recordId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
  if (!team) {
    throw new Error('Team not found')
  }

  if (!Team.hasPermission(team, session.user.id, 'viewer')) {
    throw new Error('Insufficient permissions')
  }

  const record = await DNSRecord.findOne({
    _id: recordId,
    team_id: team._id
  })

  if (!record) {
    throw new Error('DNS record not found')
  }

  const propagated = await record.checkPropagation()

  revalidatePath(`/dashboard/${teamSlug}`)
  return { success: true, propagated }
}

/**
 * Bulk import DNS records (from Zone file or JSON)
 */
export async function bulkImportDNS(
  teamSlug: string,
  domainId: string,
  records: Array<{
    type: string
    name: string
    value: string
    ttl?: number
    priority?: number
  }>
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findBySlug(teamSlug)
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

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const record of records) {
    try {
      if (!DNSRecord.validateRecord(record.type, record.value)) {
        throw new Error(`Invalid ${record.type} record value`)
      }

      await DNSRecord.create({
        team_id: team._id,
        domain_id: domainId,
        domain: domain.domain,
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: record.ttl || 3600,
        priority: record.priority,
        proxied: false,
        active: true,
        propagated: false,
        created_by: session.user.id
      })

      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${record.name}.${domain.domain}: ${getErrorMessage(error)}`)
    }
  }

  revalidatePath(`/dashboard/${teamSlug}`)
  return results
}
