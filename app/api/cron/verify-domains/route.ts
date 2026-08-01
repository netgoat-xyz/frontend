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
import { isLocalDevelopmentDomain } from '@/lib/domain-validation'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

type VerificationError = {
  domain: string
  error: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Unknown error'
}

function isMissingDnsRecordError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false
  }

  return error.code === 'ENOTFOUND' || error.code === 'ENODATA'
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-dev-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const now = new Date()
    const domainsToCheck = await Domain.find({
      active: true,
      $or: [
        { verified: false },
        {
          verified: true,
          next_verification_check: { $lte: now }
        }
      ]
    }).limit(50)

    console.log(`[Cron] Checking ${domainsToCheck.length} domains for verification`)

    const results = {
      checked: 0,
      verified: 0,
      failed: 0,
      errors: [] as VerificationError[]
    }

    for (const domain of domainsToCheck) {
      try {
        results.checked++

        if (isLocalDevelopmentDomain(domain.domain)) {
          domain.verified = true
          domain.last_verification_check = new Date()
          domain.verification_attempts = (domain.verification_attempts || 0) + 1
          domain.next_verification_check = null
          await domain.save()
          results.verified++
          console.log(`[Cron] Local development domain ${domain.domain} marked verified`)
          continue
        }

        if (!domain.verification_token) {
          console.warn(`[Cron] Domain ${domain.domain} has no verification token, skipping`)
          results.errors.push({
            domain: domain.domain,
            error: 'No verification token'
          })
          continue
        }

        const verificationHost = `_netgoat-verify.${domain.domain}`

        try {
          const records = await resolveTxt(verificationHost)
          const allRecords = records.flat()
          const verified = allRecords.some((record) => record === domain.verification_token)

          domain.last_verification_check = new Date()
          domain.verification_attempts = (domain.verification_attempts || 0) + 1

          if (verified && !domain.verified) {
            domain.verified = true
            results.verified++
            console.log(`[Cron] Domain ${domain.domain} verified successfully`)
          } else if (verified) {
            console.log(`[Cron] Domain ${domain.domain} still verified`)
          } else {
            results.failed++
            console.log(`[Cron] Domain ${domain.domain} verification failed - token not found`)
          }

          const nextCheck = new Date()
          nextCheck.setMinutes(nextCheck.getMinutes() + 30)
          domain.next_verification_check = nextCheck

          await domain.save()
        } catch (dnsError: unknown) {
          if (isMissingDnsRecordError(dnsError)) {
            results.failed++
            console.log(`[Cron] Domain ${domain.domain} - TXT record not found`)

            domain.last_verification_check = new Date()
            domain.verification_attempts = (domain.verification_attempts || 0) + 1

            const nextCheck = new Date()
            nextCheck.setMinutes(nextCheck.getMinutes() + 30)
            domain.next_verification_check = nextCheck

            await domain.save()
          } else {
            throw dnsError
          }
        }
      } catch (error: unknown) {
        console.error(`[Cron] Error checking domain ${domain.domain}:`, error)
        results.errors.push({
          domain: domain.domain,
          error: getErrorMessage(error)
        })
      }
    }

    console.log(`[Cron] Verification complete:`, results)

    return NextResponse.json({
      success: true,
      message: 'Domain verification check completed',
      results
    })
  } catch (error: unknown) {
    console.error('[Cron] Domain verification cron error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: getErrorMessage(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
