'use server'

import {
  createDomainForTeam,
  listTeamDomains,
  getDomain as getTeamDomain,
  deleteDomain as deleteTeamDomain,
  addSubdomain as addTeamSubdomain,
  removeSubdomain as removeTeamSubdomain,
  addDomainWAFRule as addTeamDomainWAFRule,
  removeDomainWAFRule as removeTeamDomainWAFRule,
  addSubdomainWAFRule as addTeamSubdomainWAFRule,
  removeSubdomainWAFRule as removeTeamSubdomainWAFRule,
  updateDomainSettings as updateTeamDomainSettings,
  toggleDomainActive as toggleTeamDomainActive
} from './teamDomains'

export async function createDomain(teamSlug: string, data: {
  domain: string
  target_url: string
  certificate_pem?: string
  private_key_pem?: string
  auto_ssl?: boolean
  verification_token?: string
}) {
  return createDomainForTeam(teamSlug, data)
}

export async function listDomains(teamSlug: string = '@me') {
  return listTeamDomains(teamSlug)
}

export async function getDomain(domainId: string, teamSlug: string = '@me') {
  return getTeamDomain(teamSlug, domainId)
}

export async function deleteDomain(domainId: string, teamSlug: string = '@me') {
  return deleteTeamDomain(teamSlug, domainId)
}

export async function addSubdomain(
  domainId: string,
  data: {
    subdomain: string
    target_url: string
    certificate_pem?: string
    private_key_pem?: string
  },
  teamSlug: string = '@me'
) {
  return addTeamSubdomain(teamSlug, domainId, data)
}

export async function removeSubdomain(domainId: string, subdomain: string, teamSlug: string = '@me') {
  return removeTeamSubdomain(teamSlug, domainId, subdomain)
}

export async function addDomainWAFRule(
  domainId: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'ALLOW'
    priority?: number
    description?: string
  },
  teamSlug: string = '@me'
) {
  return addTeamDomainWAFRule(teamSlug, domainId, data)
}

export async function removeDomainWAFRule(domainId: string, ruleName: string, teamSlug: string = '@me') {
  return removeTeamDomainWAFRule(teamSlug, domainId, ruleName)
}

export async function addSubdomainWAFRule(
  domainId: string,
  subdomain: string,
  data: {
    name: string
    expression: string
    action?: 'BLOCK' | 'LOG' | 'ALLOW'
    priority?: number
  },
  teamSlug: string = '@me'
) {
  return addTeamSubdomainWAFRule(teamSlug, domainId, subdomain, data)
}

export async function removeSubdomainWAFRule(
  domainId: string,
  subdomain: string,
  ruleName: string,
  teamSlug: string = '@me'
) {
  return removeTeamSubdomainWAFRule(teamSlug, domainId, subdomain, ruleName)
}

export async function updateDomainSettings(
  domainId: string,
  settings: {
    rate_limit?: number
    cache_enabled?: boolean
    cache_ttl?: number
    compression_enabled?: boolean
    log_level?: 'none' | 'errors' | 'all'
  },
  teamSlug: string = '@me'
) {
  return updateTeamDomainSettings(teamSlug, domainId, settings)
}

export async function toggleDomainActive(domainId: string, active: boolean, teamSlug: string = '@me') {
  return toggleTeamDomainActive(teamSlug, domainId, active)
}
