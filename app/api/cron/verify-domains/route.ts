/**
 * Background Domain Verification Cron Job
 * Automatically checks domains that need verification every 30 minutes
 * 
 * Call this endpoint from a cron service (e.g., Vercel Cron, GitHub Actions)
 * POST /api/cron/verify-domains
 * 
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Domain from '@/models/Domain'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Find domains that need verification check
    const now = new Date()
    const domainsToCheck = await Domain.find({
      active: true,
      $or: [
        // Unverified domains
        { verified: false },
        // Domains with next check time in the past (for monitoring)
        { 
          verified: true,
          next_verification_check: { $lte: now }
        }
      ]
    }).limit(50) // Process 50 domains per run to avoid timeout

    console.log(`[Cron] Checking ${domainsToCheck.length} domains for verification`)

    const results = {
      checked: 0,
      verified: 0,
      failed: 0,
      errors: [] as any[]
    }

    for (const domain of domainsToCheck) {
      try {
        results.checked++

        if (!domain.verification_token) {
          console.warn(`[Cron] Domain ${domain.domain} has no verification token, skipping`)
          results.errors.push({
            domain: domain.domain,
            error: 'No verification token'
          })
          continue
        }

        // Check DNS TXT record
        const verificationHost = `_netgoat-verify.${domain.domain}`
        
        try {
          const records = await resolveTxt(verificationHost)
          const allRecords = records.flat()
          const verified = allRecords.some(record => record === domain.verification_token)

          // Update verification tracking
          domain.last_verification_check = new Date()
          domain.verification_attempts = (domain.verification_attempts || 0) + 1

          if (verified && !domain.verified) {
            domain.verified = true
            results.verified++
            console.log(`[Cron] ✓ Domain ${domain.domain} verified successfully`)
          } else if (verified) {
            console.log(`[Cron] ✓ Domain ${domain.domain} still verified`)
          } else {
            results.failed++
            console.log(`[Cron] ✗ Domain ${domain.domain} verification failed - token not found`)
          }

          // Set next check for 30 minutes from now
          const nextCheck = new Date()
          nextCheck.setMinutes(nextCheck.getMinutes() + 30)
          domain.next_verification_check = nextCheck

          await domain.save()
        } catch (dnsError: any) {
          // DNS lookup failed
          if (dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA') {
            results.failed++
            console.log(`[Cron] ✗ Domain ${domain.domain} - TXT record not found`)

            // Update tracking
            domain.last_verification_check = new Date()
            domain.verification_attempts = (domain.verification_attempts || 0) + 1

            // Set next check for 30 minutes from now
            const nextCheck = new Date()
            nextCheck.setMinutes(nextCheck.getMinutes() + 30)
            domain.next_verification_check = nextCheck

            await domain.save()
          } else {
            throw dnsError
          }
        }
      } catch (error: any) {
        console.error(`[Cron] Error checking domain ${domain.domain}:`, error)
        results.errors.push({
          domain: domain.domain,
          error: error.message
        })
      }
    }

    console.log(`[Cron] Verification complete:`, results)

    return NextResponse.json({
      success: true,
      message: 'Domain verification check completed',
      results
    })
  } catch (error: any) {
    console.error('[Cron] Domain verification cron error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing (with same auth)
export async function GET(request: NextRequest) {
  return POST(request)
}
