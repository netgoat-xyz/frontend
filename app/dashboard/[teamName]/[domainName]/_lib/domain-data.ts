import { listTeamDomains } from '@/actions/teamDomains'

export type DomainRouteParams = {
  teamName: string
  domainName: string
}

type DomainLookup = {
  domain: string
  verified?: boolean
  target_url?: string
  certificate_pem?: string | null
  waf_rules?: unknown[]
}

export async function loadDomainByRoute(paramsPromise: Promise<DomainRouteParams> | DomainRouteParams) {
  const params = await paramsPromise
  const teamName = decodeURIComponent(params.teamName)
  const domainName = decodeURIComponent(params.domainName)

  const domains = await listTeamDomains(teamName)
  const domain = domains.find((entry: DomainLookup) => entry.domain === domainName)

  if (!domain) {
    return { teamName, domainName, domain: null }
  }

  const domainData = {
    name: domain.domain,
    status: domain.verified ? 'healthy' : 'unverified',
    origin: domain.target_url || '-',
    certExp: domain.certificate_pem ? 'installed' : 'none',
    wafStatus: Array.isArray(domain.waf_rules) && domain.waf_rules.length > 0 ? 'Active' : 'Inactive'
  }

  return { teamName, domainName, domain, domainData }
}
