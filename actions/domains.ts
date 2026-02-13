'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import Domain from '@/models/Domain'
import User from '@/models/User'
import { revalidatePath } from 'next/cache'

/**
 * Create a new domain for a team
 */
export async function createDomain(teamSlug: string, data: {
  domain: string
  target_url: string
  certificate_pem?: string
  private_key_pem?: string
  auto_ssl?: boolean
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  // Check user quota
  const user = await User.findById(session.user.id)
  if (!user) {
    throw new Error('User not found')
  }

  const domainCount = user.domain_count || 0
  const maxDomains = user.max_domains || 5

  if (domainCount >= maxDomains) {
    throw new Error(`Domain limit reached (${maxDomains} max)`)
  }

  // Create domain
  const domain = await Domain.create({
    user_id: session.user.id,
    domain: data.domain,
    target_url: data.target_url,
    certificate_pem: data.certificate_pem || null,
    private_key_pem: data.private_key_pem || null,
    ssl_enabled: !!(data.certificate_pem && data.private_key_pem),
    auto_ssl: data.auto_ssl || false,
    active: true,
    verified: false,
    waf_rules: [],
    subdomains: [],
    settings: {
      rate_limit: 100,
      cache_enabled: true,
      cache_ttl: 300,
      compression_enabled: true,
      log_level: 'errors'
    },
    stats: {
      total_requests: 0,
      total_blocked: 0,
      bandwidth_used: 0
    }
  })

  // Update user domain count
  await User.findByIdAndUpdate(session.user.id, {
    $inc: { domain_count: 1 },
    $set: { updatedAt: new Date() }
  })

  revalidatePath('/dashboard')
  return { success: true, domain: domain.toObject() }
}

/**
 * List all domains for the authenticated user
 */
export async function listDomains() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domains = await Domain.find({
    user_id: session.user.id,
    active: true
  })
    .sort({ created_at: -1 })
    .lean()

  return domains
}

/**
 * Get a specific domain by ID
 */
export async function getDomain(domainId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  }).lean()

  if (!domain) {
    throw new Error('Domain not found')
  }

  return domain
}

/**
 * Delete a domain
 */
export async function deleteDomain(domainId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await Domain.deleteOne({ _id: domainId })

  // Decrement user domain count
  await User.findByIdAndUpdate(session.user.id, {
    $inc: { domain_count: -1 },
    $set: { updatedAt: new Date() }
  })

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Add a subdomain to a domain
 */
export async function addSubdomain(
  domainId: string,
  data: {
    subdomain: string
    target_url: string
    certificate_pem?: string
    private_key_pem?: string
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  const fullDomain = `${data.subdomain}.${domain.domain}`

  await domain.addSubdomain(data.subdomain, data.target_url, {
    certificate_pem: data.certificate_pem,
    private_key_pem: data.private_key_pem
  })

  revalidatePath('/dashboard')
  return { success: true, subdomain: fullDomain }
}

/**
 * Remove a subdomain
 */
export async function removeSubdomain(domainId: string, subdomain: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeSubdomain(subdomain)

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Add a domain-level WAF rule
 */
export async function addDomainWAFRule(
  domainId: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'CHALLENGE'
    priority?: number
    description?: string
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.addWAFRule(
    data.name,
    data.expression,
    data.action || 'BLOCK',
    data.priority || 0,
    data.description
  )

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Remove a domain-level WAF rule
 */
export async function removeDomainWAFRule(domainId: string, ruleName: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeWAFRule(ruleName)

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Add a subdomain-level WAF rule
 */
export async function addSubdomainWAFRule(
  domainId: string,
  subdomain: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'CHALLENGE'
    priority?: number
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.addSubdomainWAFRule(
    subdomain,
    data.name,
    data.expression,
    data.action || 'BLOCK',
    data.priority || 0
  )

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Remove a subdomain-level WAF rule
 */
export async function removeSubdomainWAFRule(
  domainId: string,
  subdomain: string,
  ruleName: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOne({
    _id: domainId,
    user_id: session.user.id
  })

  if (!domain) {
    throw new Error('Domain not found')
  }

  await domain.removeSubdomainWAFRule(subdomain, ruleName)

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Update domain settings
 */
export async function updateDomainSettings(
  domainId: string,
  settings: {
    rate_limit?: number
    cache_enabled?: boolean
    cache_ttl?: number
    compression_enabled?: boolean
    log_level?: 'none' | 'errors' | 'all'
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOneAndUpdate(
    { _id: domainId, user_id: session.user.id },
    {
      $set: {
        settings: settings,
        updated_at: new Date()
      }
    },
    { new: true }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Toggle domain active status
 */
export async function toggleDomainActive(domainId: string, active: boolean) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const domain = await Domain.findOneAndUpdate(
    { _id: domainId, user_id: session.user.id },
    {
      $set: {
        active: active,
        updated_at: new Date()
      }
    },
    { new: true }
  )

  if (!domain) {
    throw new Error('Domain not found')
  }

  revalidatePath('/dashboard')
  return { success: true }
}
