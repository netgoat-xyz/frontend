/**
 * Domain Verification Actions
 * Handles DNS-based domain ownership verification
 */
'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongoose'
import Team from '@/models/Team'
import Domain from '@/models/Domain'
import crypto from 'crypto'
import dns from 'dns'
import { promisify } from 'util'
import { revalidatePath } from 'next/cache'
import { validateDomainWithOnlineTld } from '@/lib/domain-validation'

const resolveTxt = promisify(dns.resolveTxt)

function getErrorString(error: unknown, property: 'code' | 'message') {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  const value = (error as { code?: unknown; message?: unknown })[property]
  return typeof value === 'string' ? value : undefined
}

function isMissingDnsRecordError(error: unknown) {
  const code = getErrorString(error, 'code')
  return code === 'ENOTFOUND' || code === 'ENODATA'
}

function getErrorMessage(error: unknown, fallback: string) {
  return getErrorString(error, 'message') || fallback
}

/**
 * Generate a unique verification token for domain ownership verification
 */
export async function generateDomainVerification(
  teamSlug: string,
  domain: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    await connectDB()

    // Decode URL-encoded parameters
    const decodedTeamSlug = decodeURIComponent(teamSlug)

    let team
    
    // Handle @me or @me-{userId} - create personal team if it doesn't exist
    if (decodedTeamSlug === '@me' || decodedTeamSlug.startsWith('@me-')) {
      // Look for user's personal team with user-specific slug
      const personalSlug = decodedTeamSlug === '@me' ? `@me-${session.user.id}` : decodedTeamSlug;
      team = await Team.findOne({
        slug: personalSlug
      })
      
      if (!team) {
        // Create personal team on-the-fly for existing users
        const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
        team = await Team.create({
          name: `${userName}'s Personal Team`,
          slug: personalSlug,
          description: 'Your personal team',
          members: [{
            user_id: session.user.id,
            role: 'owner',
            joined_at: new Date()
          }],
          active: true
        })
        console.log(`Created personal team ${personalSlug} for user ${session.user.id}`)
      }
    } else {
      // Regular team lookup
      const cleanSlug = decodedTeamSlug.replace(/^@/, '')
      team = await Team.findBySlug(cleanSlug)
    }
    
    if (!team) {
      console.error('Team not found with slug:', decodedTeamSlug)
      throw new Error(`Team not found: ${decodedTeamSlug}`)
    }

    if (!Team.hasPermission(team, session.user.id, 'member')) {
      throw new Error('Insufficient permissions')
    }

    const domainValidation = await validateDomainWithOnlineTld(domain)
    if (!domainValidation.valid) {
      throw new Error(domainValidation.message || 'Invalid domain name')
    }

    const normalizedDomain = domainValidation.sanitized

    // Check if domain already exists
    const existingDomain = await Domain.findOne({ domain: normalizedDomain })
    if (existingDomain) {
      throw new Error('Domain already exists in the system')
    }

    // Generate unique verification token
    const token = `netgoat-verify-${crypto.randomBytes(32).toString('hex')}`

    // Store the verification token temporarily (you might want to add this to a DomainVerification model)
    // For now, we'll return it and expect it to be passed back during verification

    return {
      success: true,
      domain: normalizedDomain,
      token,
      recordName: '_netgoat-verify',
      recordType: 'TXT'
    }
  } catch (error) {
    console.error('Domain verification generation error:', error)
    throw new Error(getErrorMessage(error, 'Failed to generate domain verification'))
  }
}

/**
 * Verify domain ownership by checking DNS TXT record
 */
export async function verifyDomainOwnership(
  teamSlug: string,
  domain: string,
  expectedToken: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    await connectDB()

    // Decode URL-encoded parameters
    const decodedTeamSlug = decodeURIComponent(teamSlug)

    let team
    
    // Handle @me or @me-{userId} - same logic as generateDomainVerification
    if (decodedTeamSlug === '@me' || decodedTeamSlug.startsWith('@me-')) {
      // Look for user's personal team with user-specific slug
      const personalSlug = decodedTeamSlug === '@me' ? `@me-${session.user.id}` : decodedTeamSlug;
      team = await Team.findOne({
        slug: personalSlug
      })
      
      if (!team) {
        // Create personal team on-the-fly for existing users
        const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
        team = await Team.create({
          name: `${userName}'s Personal Team`,
          slug: personalSlug,
          description: 'Your personal team',
          members: [{
            user_id: session.user.id,
            role: 'owner',
            joined_at: new Date()
          }],
          active: true
        })
        console.log(`Created personal team ${personalSlug} for user ${session.user.id}`)
      }
    } else {
      // Regular team lookup
      const cleanSlug = decodedTeamSlug.replace(/^@/, '')
      team = await Team.findBySlug(cleanSlug)
    }
    
    if (!team) {
      throw new Error('Team not found')
    }

    if (!Team.hasPermission(team, session.user.id, 'member')) {
      throw new Error('Insufficient permissions')
    }

    const domainValidation = await validateDomainWithOnlineTld(domain)
    if (!domainValidation.valid) {
      throw new Error(domainValidation.message || 'Invalid domain name')
    }

    const normalizedDomain = domainValidation.sanitized

    // Check DNS TXT record
    const verificationHost = `_netgoat-verify.${normalizedDomain}`
    
    const records = await resolveTxt(verificationHost)
    
    // DNS returns arrays of strings for each TXT record
    // Flatten and check if our token exists
    const allRecords = records.flat()
    const verified = allRecords.some(record => record === expectedToken)

    if (!verified) {
      return {
        success: false,
        verified: false,
        message: 'Verification token not found in DNS records',
        foundRecords: allRecords.length
      }
    }

    return {
      success: true,
      verified: true,
      domain: normalizedDomain,
      message: 'Domain ownership verified successfully'
    }
  } catch (error) {
    // DNS lookup failed - record doesn't exist yet
    if (isMissingDnsRecordError(error)) {
      return {
        success: false,
        verified: false,
        message: 'TXT record not found. Please ensure the record is properly configured and DNS has propagated.',
        error: 'DNS_NOT_FOUND'
      }
    }

    // Other errors
    console.error('Domain verification error:', error)
    throw new Error(getErrorMessage(error, 'Failed to verify domain ownership'))
  }
}

/**
 * Check if a domain's DNS has propagated (helper function)
 */
export async function checkDNSPropagation(domain: string) {
  try {
    const domainValidation = await validateDomainWithOnlineTld(domain)
    if (!domainValidation.valid) {
      return {
        success: false,
        propagated: false,
        error: domainValidation.message || 'Invalid domain name'
      }
    }

    const records = await resolveTxt(`_netgoat-verify.${domainValidation.sanitized}`)
    return {
      success: true,
      propagated: true,
      records: records.flat()
    }
  } catch (error) {
    return {
      success: true,
      propagated: false,
      error: getErrorString(error, 'code') || 'UNKNOWN'
    }
  }
}
/**
 * Verify a domain by checking its stored verification token against DNS TXT records
 * Updates the domain's verification status in the database
 */
export async function verifyDomain(teamSlug: string, domainName: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    await connectDB()

    // Decode URL-encoded parameters
    const decodedTeamSlug = decodeURIComponent(teamSlug)

    let team
    
    // Handle @me or @me-{userId}
    if (decodedTeamSlug === '@me' || decodedTeamSlug.startsWith('@me-')) {
      const personalSlug = decodedTeamSlug === '@me' ? `@me-${session.user.id}` : decodedTeamSlug;
      team = await Team.findOne({ slug: personalSlug })
      
      if (!team) {
        const userName = session.user.name || session.user.email?.split('@')[0] || 'User'
        team = await Team.create({
          name: `${userName}'s Personal Team`,
          slug: personalSlug,
          description: 'Your personal team',
          members: [{
            user_id: session.user.id,
            role: 'owner',
            joined_at: new Date()
          }],
          active: true
        })
      }
    } else {
      const cleanSlug = decodedTeamSlug.replace(/^@/, '')
      team = await Team.findBySlug(cleanSlug)
    }
    
    if (!team) {
      throw new Error('Team not found')
    }

    if (!Team.hasPermission(team, session.user.id, 'member')) {
      throw new Error('Insufficient permissions')
    }

    const domainValidation = await validateDomainWithOnlineTld(domainName)
    if (!domainValidation.valid) {
      throw new Error(domainValidation.message || 'Invalid domain name')
    }

    const normalizedDomain = domainValidation.sanitized

    // Find the domain
    const domain = await Domain.findOne({
      team_id: team._id,
      domain: normalizedDomain,
      active: true
    })

    if (!domain) {
      throw new Error('Domain not found')
    }

    if (!domain.verification_token) {
      throw new Error('Domain has no verification token')
    }

    // Update verification attempt tracking
    domain.last_verification_check = new Date()
    domain.verification_attempts = (domain.verification_attempts || 0) + 1

    // Check DNS TXT record
    const verificationHost = `_netgoat-verify.${normalizedDomain}`
    
    try {
      const records = await resolveTxt(verificationHost)
      const allRecords = records.flat()
      const verified = allRecords.some(record => record === domain.verification_token)

      if (verified) {
        domain.verified = true
        // Set next check 30 minutes from now even after verification (for monitoring)
        const nextCheck = new Date()
        nextCheck.setMinutes(nextCheck.getMinutes() + 30)
        domain.next_verification_check = nextCheck
        await domain.save()

        // Revalidate the dashboard to show updated status
        revalidatePath(`/dashboard/${teamSlug}`)
        revalidatePath(`/dashboard/${teamSlug}/${normalizedDomain}`)

        return {
          success: true,
          verified: true,
          message: 'Domain verified successfully!',
          domain: JSON.parse(JSON.stringify(domain.toObject()))
        }
      } else {
        // Set next check for 30 minutes from now
        const nextCheck = new Date()
        nextCheck.setMinutes(nextCheck.getMinutes() + 30)
        domain.next_verification_check = nextCheck
        await domain.save()

        return {
          success: false,
          verified: false,
          message: 'Verification token not found in DNS records. Please ensure the TXT record is properly configured.',
          expectedToken: domain.verification_token,
          foundRecords: allRecords.length,
          domain: JSON.parse(JSON.stringify(domain.toObject()))
        }
      }
    } catch (error) {
      // DNS lookup failed
      if (isMissingDnsRecordError(error)) {
        // Set next check for 30 minutes from now
        const nextCheck = new Date()
        nextCheck.setMinutes(nextCheck.getMinutes() + 30)
        domain.next_verification_check = nextCheck
        await domain.save()

        return {
          success: false,
          verified: false,
          message: 'TXT record not found. Please ensure the record is properly configured and DNS has propagated.',
          error: 'DNS_NOT_FOUND',
          expectedToken: domain.verification_token,
          domain: JSON.parse(JSON.stringify(domain.toObject()))
        }
      }

      throw error
    }
  } catch (error) {
    console.error('Domain verification error:', error)
    throw new Error(getErrorMessage(error, 'Failed to verify domain'))
  }
}
