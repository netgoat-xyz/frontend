'use server'

import { Polar } from '@polar-sh/sdk'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import { Team } from '@/models/Team'
import Invoice, { type InvoiceStatus } from '@/models/Invoice'
import { getExperiments } from '@/actions/experiments'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import {
  BILLING_INTERVAL_KEYS,
  BILLING_PLAN_KEYS,
  getBillingPlanAmount,
  getBillingPlanDefinition,
  getBillingPlanPerSeatAmount,
  normalizeBillingInterval,
  normalizeBillingPlan,
  normalizeSeatCount,
  type BillingInterval,
  type BillingPlan
} from '@/lib/billing/pricing'

type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
}

type TeamMemberRef = {
  user_id: {
    toString(): string
  }
}

type TeamRecordLike = {
  _id: mongoose.Types.ObjectId
  slug: string
  name: string
  plan?: unknown
  subscription_id?: string
  members: TeamMemberRef[]
  billing_email?: string
  domain_count?: number
  max_domains?: number
  updated_at?: Date
  save?: () => Promise<unknown>
  settings?: {
    allow_member_invites?: boolean
    require_2fa?: boolean
    ip_whitelist?: string[]
    access_groups?: unknown[]
    webhooks?: {
      events?: string[]
    }
    auth_methods?: {
      magic_link?: boolean
      email_code?: boolean
    }
    retention_days?: number
    billing?: {
      auto_recharge?: boolean
      invoice_email?: string
      po_number?: string
      billing_interval?: BillingInterval
      seat_count?: number
    }
  }
}

type InvoiceRecordLike = {
  invoice_id: string
  amount: number
  status: InvoiceStatus
  issued_at: Date
  due_at: Date
  currency: string
  po_number?: string
  is_test?: boolean
}

type PolarSubscriptionSummary = {
  id: string
  productId: string
  recurringInterval: string
  status: string
  seats: number | null
  currentPeriodEnd: unknown
  createdAt: unknown
}

type PolarOrderSummary = {
  id: string
  productId: string
  status: string
  paid: boolean
  seats: number | null
  createdAt: unknown
  subscriptionId: string | null
}

type PolarRemoteBillingState =
  | {
      source: 'subscription'
      subscription: PolarSubscriptionSummary
    }
  | {
      source: 'order'
      order: PolarOrderSummary
    }

type PolarBillingSyncResult = {
  plan: BillingPlan
  billingInterval: BillingInterval
  seatCount: number
  subscriptionId: string
  server: PolarServer
}

type PolarServer = 'production' | 'sandbox'

const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isDeveloperModeTestingEnabled(
  flags: Record<string, boolean | string> | null | undefined
) {
  const rawValue =
    flags?.Developer_Mode_Testing ||
    flags?.developer_mode_testing ||
    flags?.DEVELOPER_MODE_TESTING

  if (rawValue === true) {
    return true
  }

  if (typeof rawValue === 'string') {
    return rawValue.trim().toLowerCase() === 'true'
  }

  return false
}

async function assertDeveloperModeTestingEnabled() {
  const flags = (await getExperiments()) as Record<string, boolean | string> | null | undefined

  if (!isDeveloperModeTestingEnabled(flags)) {
    throw new Error('Developer billing testing tools are disabled for this account.')
  }
}

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value)
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0))
}

function endOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999))
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function buildAppUrl(pathname: string, queryParams?: Record<string, string>) {
  const url = new URL(pathname, APP_URL)

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

function normalizePolarServer(value: unknown): PolarServer | null {
  const normalized = String(value || '').trim().toLowerCase()

  if (!normalized) return null
  if (normalized === 'production' || normalized === 'prod' || normalized === 'live') {
    return 'production'
  }
  if (
    normalized === 'sandbox' ||
    normalized === 'test' ||
    normalized === 'dev' ||
    normalized === 'development'
  ) {
    return 'sandbox'
  }

  return null
}

function getConfiguredPolarServer() {
  const candidates = [
    process.env.POLAR_SERVER,
    process.env.POLAR_ENV,
    process.env.POLAR_API_SERVER,
    process.env.POLAR_MODE
  ]

  for (const candidate of candidates) {
    const normalized = normalizePolarServer(candidate)
    if (normalized) {
      return normalized
    }
  }

  return null
}

function getAlternatePolarServer(server: PolarServer): PolarServer {
  return server === 'production' ? 'sandbox' : 'production'
}

function getPolarClient(server?: PolarServer) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim()
  if (!accessToken) {
    throw new Error('Polar billing is not configured. Missing POLAR_ACCESS_TOKEN.')
  }

  const resolvedServer = server || getConfiguredPolarServer() || 'production'

  return new Polar({
    accessToken,
    server: resolvedServer
  })
}

function getTeamExternalCustomerId(team: TeamRecordLike) {
  return `team:${team._id.toString()}`
}

function resolveTeamBillingInterval(team: TeamRecordLike) {
  return normalizeBillingInterval(team.settings?.billing?.billing_interval)
}

function resolveTeamSeatCount(team: TeamRecordLike) {
  const configuredSeatCount = team.settings?.billing?.seat_count

  if (typeof configuredSeatCount === 'number' && Number.isFinite(configuredSeatCount)) {
    return normalizeSeatCount(configuredSeatCount, 1)
  }

  return normalizeSeatCount(team.members.length, 1)
}

function ensureTeamSettingsDefaults(team: TeamRecordLike) {
  if (!team.settings) {
    team.settings = {
      allow_member_invites: false,
      require_2fa: false,
      ip_whitelist: [],
      access_groups: [],
      webhooks: {
        events: []
      },
      auth_methods: {
        magic_link: true,
        email_code: true
      },
      retention_days: 90,
      billing: {
        auto_recharge: true,
        billing_interval: 'monthly',
        seat_count: resolveTeamSeatCount(team)
      }
    }

    return
  }

  if (!team.settings.billing) {
    team.settings.billing = {
      auto_recharge: true,
      billing_interval: 'monthly',
      seat_count: resolveTeamSeatCount(team)
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

function toDateTimestamp(value: unknown) {
  if (value instanceof Date) {
    const timestamp = value.getTime()
    return Number.isFinite(timestamp) ? timestamp : 0
  }

  const parsed = new Date(String(value || ''))
  const timestamp = parsed.getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function getPolarSubscriptionStatusRank(status: string) {
  if (status === 'active') return 4
  if (status === 'trialing') return 3
  if (status === 'past_due') return 2
  if (status === 'incomplete') return 1
  return 0
}

function resolveBillingFromPolarProductId(productId: string) {
  const normalizedProductId = productId.trim()
  if (!normalizedProductId) {
    return null
  }

  for (const planKey of BILLING_PLAN_KEYS) {
    for (const intervalKey of BILLING_INTERVAL_KEYS) {
      const definition = getBillingPlanDefinition(planKey, intervalKey)
      if (definition.polarProductId === normalizedProductId) {
        return {
          plan: planKey,
          billingInterval: intervalKey
        }
      }
    }
  }

  return null
}

function resolveBillingIntervalFromPolarRecurringInterval(value: unknown): BillingInterval | null {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized === 'month' || normalized === 'monthly') {
    return 'monthly'
  }

  if (normalized === 'year' || normalized === 'annual' || normalized === 'yearly') {
    return 'annual'
  }

  return null
}

async function getMostRelevantPolarSubscription(
  polar: Polar,
  externalCustomerId: string
): Promise<PolarSubscriptionSummary | null> {
  const iterator = await polar.subscriptions.list({
    externalCustomerId,
    active: true,
    limit: 100
  })

  const subscriptions: PolarSubscriptionSummary[] = []

  for await (const page of iterator) {
    const pageRecord = asRecord(page)
    const resultRecord = asRecord(pageRecord?.result)
    const items = Array.isArray(resultRecord?.items) ? resultRecord.items : []

    for (const item of items) {
      const itemRecord = asRecord(item)
      if (!itemRecord) {
        continue
      }

      const id = String(itemRecord.id || '').trim()
      const productId = String(itemRecord.productId || '').trim()
      if (!id || !productId) {
        continue
      }

      subscriptions.push({
        id,
        productId,
        recurringInterval: String(itemRecord.recurringInterval || '').trim().toLowerCase(),
        status: String(itemRecord.status || '').trim().toLowerCase(),
        seats:
          typeof itemRecord.seats === 'number' && Number.isFinite(itemRecord.seats)
            ? Math.floor(itemRecord.seats)
            : null,
        currentPeriodEnd: itemRecord.currentPeriodEnd,
        createdAt: itemRecord.createdAt
      })
    }
  }

  if (subscriptions.length === 0) {
    return null
  }

  subscriptions.sort((left, right) => {
    const statusDiff = getPolarSubscriptionStatusRank(right.status) - getPolarSubscriptionStatusRank(left.status)
    if (statusDiff !== 0) {
      return statusDiff
    }

    const periodDiff = toDateTimestamp(right.currentPeriodEnd) - toDateTimestamp(left.currentPeriodEnd)
    if (periodDiff !== 0) {
      return periodDiff
    }

    return toDateTimestamp(right.createdAt) - toDateTimestamp(left.createdAt)
  })

  return subscriptions[0]
}

async function getMostRelevantPolarOrder(
  polar: Polar,
  externalCustomerId: string
): Promise<PolarOrderSummary | null> {
  const iterator = await polar.orders.list({
    externalCustomerId,
    limit: 100
  })

  const orders: PolarOrderSummary[] = []

  for await (const page of iterator) {
    const pageRecord = asRecord(page)
    const resultRecord = asRecord(pageRecord?.result)
    const items = Array.isArray(resultRecord?.items) ? resultRecord.items : []

    for (const item of items) {
      const itemRecord = asRecord(item)
      if (!itemRecord) {
        continue
      }

      const id = String(itemRecord.id || '').trim()
      const productId = String(itemRecord.productId || '').trim()
      if (!id || !productId) {
        continue
      }

      const paid = itemRecord.paid === true
      const status = String(itemRecord.status || '').trim().toLowerCase()
      if (!paid && status !== 'paid') {
        continue
      }

      orders.push({
        id,
        productId,
        status,
        paid,
        seats:
          typeof itemRecord.seats === 'number' && Number.isFinite(itemRecord.seats)
            ? Math.floor(itemRecord.seats)
            : null,
        createdAt: itemRecord.createdAt,
        subscriptionId:
          typeof itemRecord.subscriptionId === 'string' && itemRecord.subscriptionId.trim().length > 0
            ? itemRecord.subscriptionId.trim()
            : null
      })
    }
  }

  if (orders.length === 0) {
    return null
  }

  orders.sort((left, right) => {
    const paidDiff = Number(right.paid) - Number(left.paid)
    if (paidDiff !== 0) {
      return paidDiff
    }

    return toDateTimestamp(right.createdAt) - toDateTimestamp(left.createdAt)
  })

  return orders[0]
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  return fallback
}

function getErrorMessageLowerCase(error: unknown) {
  return getErrorMessage(error, '').toLowerCase()
}

function isPolarCustomerMissingError(error: unknown) {
  const message = getErrorMessageLowerCase(error)

  return (
    message.includes('customer does not exist') ||
    message.includes('external_customer_id') ||
    message.includes('customer not found')
  )
}

function isPolarResourceNotFoundError(error: unknown) {
  const message = getErrorMessageLowerCase(error)
  return message.includes('not found') || message.includes('does not exist')
}

function isPolarAlreadyExistsError(error: unknown) {
  const message = getErrorMessageLowerCase(error)
  return (
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('unique') ||
    message.includes('conflict')
  )
}

function isPolarInvalidTokenError(error: unknown) {
  const message = getErrorMessageLowerCase(error)

  return (
    message.includes('invalid_token') ||
    (message.includes('access token') && message.includes('invalid')) ||
    message.includes('expired, revoked, malformed')
  )
}

function buildPolarInvalidTokenMessage(operationName: string, server: PolarServer) {
  return (
    `Polar authentication failed during ${operationName} on the ${server} server. ` +
    `Set POLAR_SERVER to "production" or "sandbox" to match your token, ` +
    `verify POLAR_ACCESS_TOKEN, and restart the Next.js server after updating .env.`
  )
}

async function executeWithPolarAuthFallback<T>(
  operationName: string,
  operation: (polar: Polar, server: PolarServer) => Promise<T>
) {
  const configuredServer = getConfiguredPolarServer()
  const primaryServer = configuredServer || 'production'

  try {
    const result = await operation(getPolarClient(primaryServer), primaryServer)
    return {
      result,
      server: primaryServer,
      usedFallback: false
    }
  } catch (primaryError: unknown) {
    if (!isPolarInvalidTokenError(primaryError)) {
      throw primaryError
    }

    if (configuredServer) {
      throw new Error(buildPolarInvalidTokenMessage(operationName, primaryServer))
    }

    const fallbackServer = getAlternatePolarServer(primaryServer)

    try {
      const result = await operation(getPolarClient(fallbackServer), fallbackServer)
      return {
        result,
        server: fallbackServer,
        usedFallback: true
      }
    } catch (fallbackError: unknown) {
      if (isPolarInvalidTokenError(fallbackError)) {
        throw new Error(
          `Polar authentication failed during ${operationName} on both production and sandbox servers. ` +
            `Set POLAR_SERVER explicitly, verify POLAR_ACCESS_TOKEN, and restart the Next.js server.`
        )
      }

      throw fallbackError
    }
  }
}

function buildFallbackCustomerEmail(team: TeamRecordLike, sessionUser: SessionUser) {
  const explicitEmail = team.billing_email || sessionUser.email || ''
  if (explicitEmail.includes('@')) {
    return explicitEmail
  }

  const safeSlug = (team.slug || 'team').replace(/[^a-zA-Z0-9_-]+/g, '')
  const shortTeamId = team._id.toString().slice(-8)
  return `${safeSlug}-${shortTeamId}@example.invalid`
}

async function ensurePolarExternalCustomerExists(
  polar: Polar,
  team: TeamRecordLike,
  sessionUser: SessionUser
) {
  const externalCustomerId = getTeamExternalCustomerId(team)

  try {
    await polar.customers.getExternal({
      externalId: externalCustomerId
    })

    return {
      ensured: true,
      created: false
    }
  } catch (error: unknown) {
    if (!isPolarResourceNotFoundError(error)) {
      throw error
    }
  }

  const fallbackEmail = buildFallbackCustomerEmail(team, sessionUser)

  try {
    await polar.customers.create({
      type: 'team',
      externalId: externalCustomerId,
      name: team.name,
      email: fallbackEmail,
      metadata: {
        teamId: team._id.toString(),
        teamSlug: team.slug
      }
    })

    return {
      ensured: true,
      created: true
    }
  } catch (error: unknown) {
    if (isPolarAlreadyExistsError(error)) {
      return {
        ensured: true,
        created: false
      }
    }

    throw error
  }
}

async function syncTeamBillingFromPolar(team: TeamRecordLike): Promise<PolarBillingSyncResult | null> {
  if (!process.env.POLAR_ACCESS_TOKEN?.trim()) {
    return null
  }

  try {
    const externalCustomerId = getTeamExternalCustomerId(team)

    const { result: remoteState, server } = await executeWithPolarAuthFallback(
      'subscription sync',
      async (polar): Promise<PolarRemoteBillingState | null> => {
        try {
          const subscription = await getMostRelevantPolarSubscription(polar, externalCustomerId)
          if (subscription) {
            return {
              source: 'subscription',
              subscription
            }
          }
        } catch {
          // Ignore subscription lookup errors and continue with order fallback.
        }

        try {
          const order = await getMostRelevantPolarOrder(polar, externalCustomerId)
          if (order) {
            return {
              source: 'order',
              order
            }
          }
        } catch {
          // Ignore order lookup errors and return local billing state.
        }

        return null
      }
    )

    if (!remoteState) {
      return null
    }

    const mappedProduct =
      remoteState.source === 'subscription'
        ? resolveBillingFromPolarProductId(remoteState.subscription.productId)
        : resolveBillingFromPolarProductId(remoteState.order.productId)

    const billingInterval =
      mappedProduct?.billingInterval ||
      (remoteState.source === 'subscription'
        ? resolveBillingIntervalFromPolarRecurringInterval(remoteState.subscription.recurringInterval)
        : null) ||
      resolveTeamBillingInterval(team)

    const plan = mappedProduct?.plan || normalizeBillingPlan(team.plan)
    const seatCount =
      remoteState.source === 'subscription'
        ? normalizeSeatCount(remoteState.subscription.seats, resolveTeamSeatCount(team))
        : normalizeSeatCount(remoteState.order.seats, resolveTeamSeatCount(team))

    const nextSubscriptionId =
      remoteState.source === 'subscription'
        ? remoteState.subscription.id
        : String(remoteState.order.subscriptionId || team.subscription_id || '').trim()

    const currentPlan = normalizeBillingPlan(team.plan)
    const currentInterval = resolveTeamBillingInterval(team)
    const currentSeatCount = resolveTeamSeatCount(team)
    const currentSubscriptionId = String(team.subscription_id || '').trim()

    const changed =
      currentPlan !== plan ||
      currentInterval !== billingInterval ||
      currentSeatCount !== seatCount ||
      currentSubscriptionId !== nextSubscriptionId

    if (changed) {
      ensureTeamSettingsDefaults(team)

      team.plan = plan
      team.subscription_id = nextSubscriptionId || undefined
      if (team.settings?.billing) {
        team.settings.billing.billing_interval = billingInterval
        team.settings.billing.seat_count = seatCount
      }
      team.updated_at = new Date()

      if (typeof team.save === 'function') {
        await team.save()
      }
    }

    return {
      plan,
      billingInterval,
      seatCount,
      subscriptionId: nextSubscriptionId,
      server
    }
  } catch (error: unknown) {
    if (isPolarResourceNotFoundError(error) || isPolarCustomerMissingError(error)) {
      return null
    }

    return null
  }
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function ensureTeamMembership(team: TeamRecordLike, userId: string) {
  const isMember = team.members.some((member) => member.user_id.toString() === userId)
  if (!isMember) {
    throw new Error('Access denied')
  }
}

async function resolveTeamBySlug(slug: string, sessionUser: SessionUser) {
  const decodedSlug = decodeURIComponent(slug)

  if (!mongoose.isValidObjectId(sessionUser.id)) {
    throw new Error('Invalid user id')
  }

  if (decodedSlug === '@me' || decodedSlug.startsWith('@me-')) {
    const personalSlug = decodedSlug === '@me' ? `@me-${sessionUser.id}` : decodedSlug
    let team = await Team.findOne({ slug: personalSlug, active: true })

    if (!team) {
      team = await Team.create({
        name: `${sessionUser.name || sessionUser.email || 'User'}'s Personal Team`,
        slug: personalSlug,
        description: 'Your personal team',
        members: [
          {
            user_id: new mongoose.Types.ObjectId(sessionUser.id),
            role: 'owner',
            joined_at: new Date()
          }
        ],
        active: true
      })
    }

    return team
  }

  const cleanSlug = decodedSlug.replace(/^@/, '')
  return Team.findBySlug(cleanSlug)
}

async function buildInvoiceId(issuedAt: Date) {
  const year = issuedAt.getUTCFullYear()
  const month = String(issuedAt.getUTCMonth() + 1).padStart(2, '0')
  const prefix = `INV-${year}-${month}`
  const existingCount = await Invoice.countDocuments({
    invoice_id: { $regex: `^${prefix}-` }
  })

  const seq = String(existingCount + 1).padStart(4, '0')
  return `${prefix}-${seq}`
}

function mapInvoice(invoice: InvoiceRecordLike) {
  return {
    id: invoice.invoice_id,
    amount: invoice.amount,
    status: invoice.status,
    issuedAt: invoice.issued_at.toISOString(),
    dueAt: invoice.due_at.toISOString(),
    currency: invoice.currency,
    poNumber: invoice.po_number,
    isTest: invoice.is_test
  }
}

async function createInvoiceRecord(
  team: TeamRecordLike,
  options?: {
    status?: InvoiceStatus
    isTest?: boolean
    amountOverride?: number
    lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
    issuedAt?: Date
    interval?: BillingInterval
    seatCount?: number
  }
) {
  const issuedAt = options?.issuedAt || new Date()
  const normalizedPlan = normalizeBillingPlan(team.plan)
  const interval = normalizeBillingInterval(options?.interval || resolveTeamBillingInterval(team))
  const seatCount = normalizeSeatCount(options?.seatCount || resolveTeamSeatCount(team), 1)
  const amount =
    typeof options?.amountOverride === 'number'
      ? Math.max(0, options.amountOverride)
      : getBillingPlanAmount(normalizedPlan, interval, seatCount)

  const perSeatAmount = getBillingPlanPerSeatAmount(normalizedPlan, interval)

  const lineItems =
    options?.lineItems && options.lineItems.length > 0
      ? options.lineItems.map((item) => ({
          description: item.description,
          quantity: Math.max(1, item.quantity),
          unit_price: Math.max(0, item.unitPrice),
          total: Math.max(0, item.quantity * item.unitPrice)
        }))
      : [
          {
            description: `${normalizedPlan.toUpperCase()} ${interval} plan subscription (${seatCount} seat${seatCount === 1 ? '' : 's'})`,
            quantity: seatCount,
            unit_price: perSeatAmount,
            total: amount
          }
        ]

  const invoiceId = await buildInvoiceId(issuedAt)

  return Invoice.create({
    team_id: team._id,
    invoice_id: invoiceId,
    status: options?.status || 'pending',
    amount,
    currency: 'USD',
    issued_at: issuedAt,
    due_at: addDays(issuedAt, 14),
    period_start: startOfMonth(issuedAt),
    period_end: endOfMonth(issuedAt),
    billing_email: team.billing_email,
    invoice_email: team.settings?.billing?.invoice_email,
    po_number: team.settings?.billing?.po_number,
    line_items: lineItems,
    is_test: Boolean(options?.isTest)
  })
}

/**
 * Returns billing details, role permissions, and recent invoices for a team.
 */
export async function getBillingOverview(slug: string = '@me') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canViewBilling =
    Team.hasCapability(team, session.user.id, 'billing.view') ||
    Team.hasPermission(team, session.user.id, 'viewer')
  if (!canViewBilling) {
    throw new Error('Insufficient permissions to view billing')
  }

  const polarSync = await syncTeamBillingFromPolar(team)

  let invoices = await Invoice.find({ team_id: team._id })
    .sort({ issued_at: -1 })
    .limit(24)
    .lean()

  const plan = polarSync?.plan || normalizeBillingPlan(team.plan)
  const billingInterval = polarSync?.billingInterval || resolveTeamBillingInterval(team)
  const seatCount = polarSync?.seatCount || resolveTeamSeatCount(team)
  const planAmount = getBillingPlanAmount(plan, billingInterval, seatCount)

  if (invoices.length === 0 && planAmount > 0) {
    const seedInvoice = await createInvoiceRecord(team, {
      status: 'paid',
      issuedAt: addDays(new Date(), -30),
      interval: billingInterval,
      seatCount
    })

    invoices = [serialize(seedInvoice.toObject())]
  }

  const billingEmail = team.billing_email || session.user.email || ''
  const invoiceEmail =
    team.settings?.billing?.invoice_email ||
    team.billing_email ||
    session.user.email ||
    ''

  return serialize({
    teamSlug: team.slug,
    teamName: team.name,
    plan,
    billingInterval,
    seatCount,
    planAmount,
    pricing: BILLING_PLAN_KEYS.map((planKey) => {
      const monthlyDefinition = getBillingPlanDefinition(planKey, 'monthly')
      const annualDefinition = getBillingPlanDefinition(planKey, 'annual')
      const activeDefinition = getBillingPlanDefinition(planKey, billingInterval)

      return {
        key: monthlyDefinition.key,
        label: monthlyDefinition.label,
        amount: getBillingPlanAmount(planKey, billingInterval, seatCount),
        monthlyAmount: getBillingPlanAmount(planKey, 'monthly', seatCount),
        annualAmount: getBillingPlanAmount(planKey, 'annual', seatCount),
        monthlyPerSeat: monthlyDefinition.perSeatPrice,
        annualPerSeat: annualDefinition.perSeatPrice,
        currency: monthlyDefinition.currency,
        hasPolarProduct: Boolean(activeDefinition.polarProductId),
        hasPolarProductMonthly: Boolean(monthlyDefinition.polarProductId),
        hasPolarProductAnnual: Boolean(annualDefinition.polarProductId)
      }
    }),
    payments: {
      provider: 'polar',
      configured: Boolean(process.env.POLAR_ACCESS_TOKEN?.trim()),
      server: polarSync?.server || getConfiguredPolarServer() || 'production',
      subscriptionId: polarSync?.subscriptionId || team.subscription_id || null
    },
    domainUsage: {
      used: team.domain_count || 0,
      total: team.max_domains || 0
    },
    billingEmail,
    invoiceEmail,
    poNumber: team.settings?.billing?.po_number || '',
    autoRecharge: team.settings?.billing?.auto_recharge ?? true,
    invoices: invoices.map(mapInvoice),
    permissions: {
      canManageBilling:
        Team.hasCapability(team, session.user.id, 'billing.manage') ||
        Team.hasPermission(team, session.user.id, 'admin'),
      canManageInvoices:
        Team.hasCapability(team, session.user.id, 'invoices.manage') ||
        Team.hasPermission(team, session.user.id, 'admin')
    }
  })
}

/**
 * Save billing + invoice delivery preferences for a team.
 */
export async function updateBillingSettings(
  slug: string,
  data: {
    billingEmail?: string
    invoiceEmail?: string
    poNumber?: string
    autoRecharge?: boolean
    billingInterval?: BillingInterval | string
    seatCount?: number
  }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canManageBilling =
    Team.hasCapability(team, session.user.id, 'billing.manage') ||
    Team.hasPermission(team, session.user.id, 'admin')
  if (!canManageBilling) {
    throw new Error('Insufficient permissions to manage billing')
  }

  const normalizedBillingEmail =
    typeof data.billingEmail === 'string' ? normalizeEmail(data.billingEmail) : undefined
  const normalizedInvoiceEmail =
    typeof data.invoiceEmail === 'string' ? normalizeEmail(data.invoiceEmail) : undefined
  const normalizedBillingInterval =
    typeof data.billingInterval === 'string'
      ? normalizeBillingInterval(data.billingInterval)
      : undefined

  if (
    typeof data.seatCount === 'number' &&
    (!Number.isFinite(data.seatCount) || data.seatCount < 1)
  ) {
    throw new Error('Seat count must be a positive number')
  }

  const normalizedSeatCount =
    typeof data.seatCount === 'number' ? normalizeSeatCount(data.seatCount, 1) : undefined

  if (normalizedBillingEmail && !isValidEmail(normalizedBillingEmail)) {
    throw new Error('Invalid billing email')
  }

  if (normalizedInvoiceEmail && !isValidEmail(normalizedInvoiceEmail)) {
    throw new Error('Invalid invoice email')
  }

  if (normalizedBillingEmail) {
    team.billing_email = normalizedBillingEmail
  }

  ensureTeamSettingsDefaults(team)

  if (normalizedInvoiceEmail) {
    team.settings.billing.invoice_email = normalizedInvoiceEmail
  }

  if (typeof data.poNumber === 'string') {
    team.settings.billing.po_number = data.poNumber.trim().slice(0, 120)
  }

  if (typeof data.autoRecharge === 'boolean') {
    team.settings.billing.auto_recharge = data.autoRecharge
  }

  if (normalizedBillingInterval) {
    team.settings.billing.billing_interval = normalizedBillingInterval
  }

  if (typeof normalizedSeatCount === 'number') {
    team.settings.billing.seat_count = normalizedSeatCount
  }

  team.updated_at = new Date()
  await team.save()

  revalidatePath('/account/settings')
  revalidatePath(`/dashboard/${team.slug}`)

  return serialize({
    success: true,
    billingEmail: team.billing_email || '',
    invoiceEmail: team.settings.billing.invoice_email || team.billing_email || '',
    poNumber: team.settings.billing.po_number || '',
    autoRecharge: team.settings.billing.auto_recharge ?? true,
    billingInterval: normalizeBillingInterval(team.settings.billing.billing_interval),
    seatCount: resolveTeamSeatCount(team)
  })
}

/**
 * List all invoices for a team ordered by latest issue date.
 */
export async function listTeamInvoices(slug: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canViewInvoices =
    Team.hasCapability(team, session.user.id, 'invoices.view') ||
    Team.hasPermission(team, session.user.id, 'viewer')

  if (!canViewInvoices) {
    throw new Error('Insufficient permissions to view invoices')
  }

  const invoices = await Invoice.find({ team_id: team._id }).sort({ issued_at: -1 }).lean()
  return serialize(invoices.map(mapInvoice))
}

/**
 * Create a debug invoice for billing verification workflows.
 */
export async function createDebugInvoice(slug: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()
  await assertDeveloperModeTestingEnabled()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canCreateInvoice =
    Team.hasCapability(team, session.user.id, 'invoices.manage') ||
    Team.hasCapability(team, session.user.id, 'billing.manage') ||
    Team.hasPermission(team, session.user.id, 'admin')

  if (!canCreateInvoice) {
    throw new Error('Insufficient permissions to create invoices')
  }

  const normalizedPlan = normalizeBillingPlan(team.plan)
  const billingInterval = resolveTeamBillingInterval(team)
  const seatCount = resolveTeamSeatCount(team)
  const perSeatAmount = getBillingPlanPerSeatAmount(normalizedPlan, billingInterval)

  const invoice = await createInvoiceRecord(team, {
    status: 'pending',
    isTest: true,
    lineItems: [
      {
        description: `Billing debug test charge (${billingInterval}, ${seatCount} seat${seatCount === 1 ? '' : 's'})`,
        quantity: seatCount,
        unitPrice: perSeatAmount
      }
    ],
    interval: billingInterval,
    seatCount
  })

  revalidatePath('/account/settings')
  revalidatePath(`/dashboard/${team.slug}`)

  return serialize({
    success: true,
    invoice: mapInvoice(invoice.toObject())
  })
}

/**
 * Run billing diagnostics and return pass/fail checks for debugging.
 */
export async function runBillingDebugTests(slug: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()
  await assertDeveloperModeTestingEnabled()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canRunDebug =
    Team.hasCapability(team, session.user.id, 'billing.manage') ||
    Team.hasPermission(team, session.user.id, 'admin')

  if (!canRunDebug) {
    throw new Error('Insufficient permissions to run billing diagnostics')
  }

  const tests: Array<{ key: string; label: string; passed: boolean; details: string }> = []

  const billingEmail = team.billing_email || ''
  const invoiceEmail = team.settings?.billing?.invoice_email || ''
  const plan = normalizeBillingPlan(team.plan)
  const billingInterval = resolveTeamBillingInterval(team)
  const seatCount = resolveTeamSeatCount(team)
  const planAmount = getBillingPlanAmount(plan, billingInterval, seatCount)
  const perSeatAmount = getBillingPlanPerSeatAmount(plan, billingInterval)
  const activePlanDefinition = getBillingPlanDefinition(plan, billingInterval)
  const monthlyPlanDefinition = getBillingPlanDefinition(plan, 'monthly')
  const annualPlanDefinition = getBillingPlanDefinition(plan, 'annual')

  tests.push({
    key: 'billing-email',
    label: 'Billing email validation',
    passed: billingEmail.length > 0 && isValidEmail(billingEmail),
    details:
      billingEmail.length > 0
        ? `Configured as ${billingEmail}`
        : 'No billing email is set for this team.'
  })

  tests.push({
    key: 'invoice-email',
    label: 'Invoice recipient validation',
    passed: invoiceEmail.length > 0 && isValidEmail(invoiceEmail),
    details:
      invoiceEmail.length > 0
        ? `Configured as ${invoiceEmail}`
        : 'No invoice recipient email is configured.'
  })

  tests.push({
    key: 'plan-price',
    label: 'Plan pricing map check',
    passed: Number.isFinite(planAmount),
    details: `Plan ${plan} (${billingInterval}) resolves to $${planAmount} total at $${perSeatAmount} per seat for ${seatCount} seat${seatCount === 1 ? '' : 's'}.`
  })

  tests.push({
    key: 'billing-interval',
    label: 'Billing interval check',
    passed: billingInterval === 'monthly' || billingInterval === 'annual',
    details: `Team billing interval is ${billingInterval}.`
  })

  tests.push({
    key: 'seat-count',
    label: 'Seat count check',
    passed: Number.isFinite(seatCount) && seatCount > 0,
    details: `Team billing seat count resolves to ${seatCount}.`
  })

  const hasPolarAccessToken = Boolean(process.env.POLAR_ACCESS_TOKEN?.trim())
  const polarServer = getConfiguredPolarServer() || 'production'
  tests.push({
    key: 'polar-access-token',
    label: 'Polar access token check',
    passed: hasPolarAccessToken,
    details: hasPolarAccessToken
      ? 'POLAR_ACCESS_TOKEN is configured.'
      : 'POLAR_ACCESS_TOKEN is missing.'
  })

  tests.push({
    key: 'polar-server-target',
    label: 'Polar API server target',
    passed: true,
    details: `Polar SDK server target is ${polarServer}.`
  })

  tests.push({
    key: 'polar-product-map-active',
    label: 'Polar active interval product mapping',
    passed: Boolean(activePlanDefinition.polarProductId),
    details: activePlanDefinition.polarProductId
      ? `Mapped ${plan}/${billingInterval} to Polar product ${activePlanDefinition.polarProductId}.`
      : `No Polar product configured for ${plan}/${billingInterval}.`
  })

  tests.push({
    key: 'polar-product-map-monthly',
    label: 'Polar monthly product mapping',
    passed: Boolean(monthlyPlanDefinition.polarProductId),
    details: monthlyPlanDefinition.polarProductId
      ? `Mapped ${plan}/monthly to Polar product ${monthlyPlanDefinition.polarProductId}.`
      : `No Polar product configured for ${plan}/monthly.`
  })

  tests.push({
    key: 'polar-product-map-annual',
    label: 'Polar annual product mapping',
    passed: Boolean(annualPlanDefinition.polarProductId),
    details: annualPlanDefinition.polarProductId
      ? `Mapped ${plan}/annual to Polar product ${annualPlanDefinition.polarProductId}.`
      : `No Polar product configured for ${plan}/annual.`
  })

  const invoiceCount = await Invoice.countDocuments({ team_id: team._id })
  tests.push({
    key: 'invoice-storage',
    label: 'Invoice storage read check',
    passed: invoiceCount >= 0,
    details: `Found ${invoiceCount} invoice records.`
  })

  try {
    const debugInvoice = await createInvoiceRecord(team, {
      status: 'draft',
      isTest: true,
      lineItems: [
        {
          description: 'Billing debug synthetic line item',
          quantity: 1,
          unitPrice: 0
        }
      ]
    })

    tests.push({
      key: 'invoice-write',
      label: 'Invoice creation write check',
      passed: Boolean(debugInvoice?._id),
      details: `Created debug invoice ${debugInvoice.invoice_id}.`
    })
  } catch (error: unknown) {
    tests.push({
      key: 'invoice-write',
      label: 'Invoice creation write check',
      passed: false,
      details: getErrorMessage(error, 'Invoice creation failed during debug test.')
    })
  }

  const passedCount = tests.filter((test) => test.passed).length
  const failedCount = tests.length - passedCount

  return serialize({
    success: failedCount === 0,
    executedAt: new Date().toISOString(),
    summary: {
      total: tests.length,
      passed: passedCount,
      failed: failedCount
    },
    tests
  })
}

/**
 * Create a Polar checkout session for upgrading/changing the team plan.
 */
export async function createPolarCheckoutSession(
  slug: string,
  requestedPlan?: BillingPlan | string,
  requestedInterval?: BillingInterval | string,
  requestedSeats?: number
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canManageBilling =
    Team.hasCapability(team, session.user.id, 'billing.manage') ||
    Team.hasPermission(team, session.user.id, 'admin')
  if (!canManageBilling) {
    throw new Error('Insufficient permissions to manage billing')
  }

  if (
    typeof requestedSeats === 'number' &&
    (!Number.isFinite(requestedSeats) || requestedSeats < 1)
  ) {
    throw new Error('Seat count must be a positive number')
  }

  const targetPlan = normalizeBillingPlan(requestedPlan || team.plan)
  const targetInterval = normalizeBillingInterval(
    requestedInterval || team.settings?.billing?.billing_interval || 'monthly'
  )
  const targetSeatCount = normalizeSeatCount(
    typeof requestedSeats === 'number' ? requestedSeats : resolveTeamSeatCount(team),
    1
  )

  const planDefinition = getBillingPlanDefinition(targetPlan, targetInterval)
  const polarProductId = planDefinition.polarProductId
  if (!polarProductId) {
    throw new Error(
      `Polar product ID is not configured for the ${targetPlan} plan (${targetInterval}).`
    )
  }

  const estimatedAmount = getBillingPlanAmount(targetPlan, targetInterval, targetSeatCount)
  const perSeatAmount = getBillingPlanPerSeatAmount(targetPlan, targetInterval)

  const successUrl = buildAppUrl('/account/settings', {
    section: 'billing',
    checkout: 'success',
    plan: targetPlan,
    interval: targetInterval,
    seats: String(targetSeatCount),
    team: team.slug
  })

  const returnUrl = buildAppUrl('/account/settings', {
    section: 'billing',
    interval: targetInterval,
    seats: String(targetSeatCount),
    team: team.slug
  })

  try {
    const { result: checkout, server: checkoutServer } = await executeWithPolarAuthFallback(
      'checkout session creation',
      async (polar) =>
        polar.checkouts.create({
          products: [polarProductId],
          seats: targetSeatCount,
          minSeats: 1,
          maxSeats: 1000,
          successUrl,
          returnUrl,
          externalCustomerId: getTeamExternalCustomerId(team),
          customerName: team.name,
          customerEmail: team.billing_email || session.user.email || undefined,
          metadata: {
            teamId: team._id.toString(),
            teamSlug: team.slug,
            requestedPlan: targetPlan,
            requestedInterval: targetInterval,
            requestedSeats: String(targetSeatCount),
            estimatedAmount: String(estimatedAmount),
            perSeatAmount: String(perSeatAmount)
          }
        })
    )

    ensureTeamSettingsDefaults(team)
    if (team.settings?.billing) {
      team.settings.billing.billing_interval = targetInterval
      team.settings.billing.seat_count = targetSeatCount
    }
    team.updated_at = new Date()
    if (typeof team.save === 'function') {
      await team.save()
    }

    return serialize({
      success: true,
      provider: 'polar',
      server: checkoutServer,
      plan: targetPlan,
      interval: targetInterval,
      seatCount: targetSeatCount,
      estimatedAmount,
      checkoutId: checkout.id,
      checkoutUrl: checkout.url
    })
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to create Polar checkout session.'))
  }
}

/**
 * Create a Polar customer portal session for managing payment methods and subscriptions.
 */
export async function createPolarCustomerPortalSession(slug: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await resolveTeamBySlug(slug, session.user)
  if (!team) {
    throw new Error('Team not found')
  }

  ensureTeamMembership(team, session.user.id)

  const canManageBilling =
    Team.hasCapability(team, session.user.id, 'billing.manage') ||
    Team.hasPermission(team, session.user.id, 'admin')
  if (!canManageBilling) {
    throw new Error('Insufficient permissions to manage billing')
  }

  const returnUrl = buildAppUrl('/account/settings', {
    section: 'billing',
    team: team.slug
  })

  const externalCustomerId = getTeamExternalCustomerId(team)

  const createSession = (polar: Polar) =>
    polar.customerSessions.create({
      externalCustomerId,
      returnUrl
    })

  try {
    const { result: portalResult, server: portalServer } = await executeWithPolarAuthFallback(
      'customer portal session creation',
      async (polar) => {
        try {
          const customerSession = await createSession(polar)

          if (!customerSession?.customerPortalUrl) {
            throw new Error('Polar customer portal URL was not returned.')
          }

          return {
            customerSession,
            customerProvisioned: false
          }
        } catch (error: unknown) {
          if (!isPolarCustomerMissingError(error)) {
            throw error
          }

          try {
            const provisionResult = await ensurePolarExternalCustomerExists(polar, team, session.user)
            const customerSession = await createSession(polar)

            if (!customerSession?.customerPortalUrl) {
              throw new Error('Polar customer portal URL was not returned after customer provisioning.')
            }

            return {
              customerSession,
              customerProvisioned: provisionResult.created
            }
          } catch (provisionError: unknown) {
            throw new Error(
              getErrorMessage(
                provisionError,
                'Failed to create Polar customer portal session after customer provisioning. Ensure POLAR_ACCESS_TOKEN has customer_sessions:write and customers:write scopes.'
              )
            )
          }
        }
      }
    )

    return serialize({
      success: true,
      provider: 'polar',
      server: portalServer,
      customerProvisioned: portalResult.customerProvisioned,
      customerSessionId: portalResult.customerSession.id,
      customerPortalUrl: portalResult.customerSession.customerPortalUrl,
      expiresAt: portalResult.customerSession.expiresAt
    })
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(
        error,
        'Failed to create Polar customer portal session. Complete at least one checkout first.'
      )
    )
  }
}
