export type BillingPlan = 'free' | 'pro' | 'enterprise'
export type BillingInterval = 'monthly' | 'annual'

type BillingCurrency = 'USD'

type BillingPlanBaseConfig = {
  key: BillingPlan
  label: string
  currency: BillingCurrency
  perSeatPrices: Record<BillingInterval, number>
}

export interface BillingPlanDefinition {
  key: BillingPlan
  label: string
  interval: BillingInterval
  perSeatPrice: number
  amount: number
  currency: BillingCurrency
  polarProductId?: string
}

function readEnvNumber(key: string, fallback: number) {
  const rawValue = process.env[key]
  if (!rawValue) return fallback

  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : fallback
}

const PLAN_BASE_CONFIG: Record<BillingPlan, BillingPlanBaseConfig> = {
  free: {
    key: 'free',
    label: 'Free',
    currency: 'USD',
    perSeatPrices: {
      monthly: readEnvNumber('POLAR_PRODUCT_FREE_MONTHLY_PRICE', 0),
      annual: readEnvNumber('POLAR_PRODUCT_FREE_ANNUAL_PRICE', 0)
    }
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    currency: 'USD',
    perSeatPrices: {
      monthly: readEnvNumber('POLAR_PRODUCT_PRO_MONTHLY_PRICE', 0),
      annual: readEnvNumber('POLAR_PRODUCT_PRO_ANNUAL_PRICE', 0)
    }
  },
  enterprise: {
    key: 'enterprise',
    label: 'Enterprise',
    currency: 'USD',
    perSeatPrices: {
      monthly: readEnvNumber('POLAR_PRODUCT_ENTERPRISE_MONTHLY_PRICE', 0),
      annual: readEnvNumber('POLAR_PRODUCT_ENTERPRISE_ANNUAL_PRICE', 0)
    }
  }
}

const POLAR_PRODUCT_IDS: Partial<Record<BillingPlan, Partial<Record<BillingInterval, string>>>> = {
  free: {
    monthly:
      process.env.POLAR_PRODUCT_ID_FREE_MONTHLY?.trim() || process.env.POLAR_PRODUCT_ID_FREE?.trim(),
    annual:
      process.env.POLAR_PRODUCT_ID_FREE_ANNUAL?.trim() ||
      process.env.POLAR_PRODUCT_ID_FREE_YEARLY?.trim() ||
      process.env.POLAR_PRODUCT_ID_FREE?.trim()
  },
  pro: {
    monthly:
      process.env.POLAR_PRODUCT_ID_PRO_MONTHLY?.trim() || process.env.POLAR_PRODUCT_ID_PRO?.trim(),
    annual:
      process.env.POLAR_PRODUCT_ID_PRO_ANNUAL?.trim() || process.env.POLAR_PRODUCT_ID_PRO_YEARLY?.trim()
  },
  enterprise: {
    monthly:
      process.env.POLAR_PRODUCT_ID_ENTERPRISE_MONTHLY?.trim() ||
      process.env.POLAR_PRODUCT_ID_ENTERPRISE?.trim(),
    annual:
      process.env.POLAR_PRODUCT_ID_ENTERPRISE_ANNUAL?.trim() ||
      process.env.POLAR_PRODUCT_ID_ENTERPRISE_YEARLY?.trim()
  }
}

export const BILLING_PLAN_KEYS: BillingPlan[] = ['free', 'pro', 'enterprise']
export const BILLING_INTERVAL_KEYS: BillingInterval[] = ['monthly', 'annual']

export function normalizeBillingPlan(value: unknown): BillingPlan {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'pro') return 'pro'
  if (normalized === 'enterprise') return 'enterprise'
  return 'free'
}

export function normalizeBillingInterval(value: unknown): BillingInterval {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'annual' || normalized === 'yearly') return 'annual'
  return 'monthly'
}

export function normalizeSeatCount(value: unknown, fallback: number = 1) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback

  const normalized = Math.floor(parsed)
  if (normalized < 1) return fallback

  return Math.min(normalized, 1000)
}

export function getBillingPlanDefinition(
  plan: BillingPlan,
  interval: BillingInterval = 'monthly'
): BillingPlanDefinition {
  const base = PLAN_BASE_CONFIG[plan]
  const normalizedInterval = normalizeBillingInterval(interval)
  const perSeatPrice = base.perSeatPrices[normalizedInterval]
  const productId = POLAR_PRODUCT_IDS[plan]?.[normalizedInterval]

  return {
    key: base.key,
    label: base.label,
    interval: normalizedInterval,
    perSeatPrice,
    amount: perSeatPrice,
    currency: base.currency,
    polarProductId: productId
  }
}

export function getBillingPlanPerSeatAmount(
  plan: BillingPlan,
  interval: BillingInterval = 'monthly'
) {
  return PLAN_BASE_CONFIG[plan].perSeatPrices[normalizeBillingInterval(interval)]
}

export function getBillingPlanAmount(
  plan: BillingPlan,
  interval: BillingInterval = 'monthly',
  seatCount: number = 1
) {
  const normalizedSeats = normalizeSeatCount(seatCount, 1)
  return getBillingPlanPerSeatAmount(plan, interval) * normalizedSeats
}

export function hasPolarProduct(plan: BillingPlan, interval: BillingInterval = 'monthly') {
  return Boolean(POLAR_PRODUCT_IDS[plan]?.[normalizeBillingInterval(interval)])
}
