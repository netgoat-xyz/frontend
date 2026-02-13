'use client'

import { useState } from 'react'
import { createDomain, listDomains, addSubdomain, addDomainWAFRule } from '@/actions/domains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Domain {
  _id: string
  domain: string
  target_url: string
  ssl_enabled: boolean
  verified: boolean
  active: boolean
  subdomains: any[]
  waf_rules: any[]
  stats: {
    total_requests: number
    total_blocked: number
    bandwidth_used: number
  }
  created_at: Date
}

export function DomainManagement({ teamSlug = '@me' }: { teamSlug?: string }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState({ domain: '', target_url: '' })

  // Load domains
  const loadDomains = async () => {
    try {
      setLoading(true)
      const result = await listDomains()
      setDomains(result as any)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Create domain
  const handleCreateDomain = async () => {
    if (!newDomain.domain || !newDomain.target_url) {
      toast.error('Domain and target URL are required')
      return
    }

    try {
      setLoading(true)
      await createDomain(teamSlug, {
        domain: newDomain.domain,
        target_url: newDomain.target_url
      })
      toast.success('Domain created! Agents will receive update automatically.')
      setNewDomain({ domain: '', target_url: '' })
      await loadDomains()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add subdomain
  const handleAddSubdomain = async (domainId: string, domain: string) => {
    const subdomain = prompt('Enter subdomain prefix (e.g., "api"):')
    const targetUrl = prompt('Enter target URL:')

    if (!subdomain || !targetUrl) return

    try {
      setLoading(true)
      await addSubdomain(domainId, {
        subdomain,
        target_url: targetUrl
      })
      toast.success(`Subdomain ${subdomain}.${domain} created!`)
      await loadDomains()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add WAF rule
  const handleAddWAFRule = async (domainId: string) => {
    const name = prompt('Rule name (e.g., "block-sql-injection"):')
    const expression = prompt('Expression (e.g., "contains(request.path, \'SELECT\')"):')

    if (!name || !expression) return

    try {
      setLoading(true)
      await addDomainWAFRule(domainId, {
        name,
        expression,
        action: 'BLOCK',
        priority: 10
      })
      toast.success('WAF rule added! Agents will enforce it immediately.')
      await loadDomains()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Domain</CardTitle>
          <CardDescription>
            Domains are automatically synced to agents via MongoDB change streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newDomain.domain}
              onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
            />
            <Input
              placeholder="http://backend:8080"
              value={newDomain.target_url}
              onChange={(e) => setNewDomain({ ...newDomain, target_url: e.target.value })}
            />
            <Button onClick={handleCreateDomain} disabled={loading}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Domains</h2>
        <Button onClick={loadDomains} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {domains.map((domain) => (
          <Card key={domain._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{domain.domain}</CardTitle>
                  <CardDescription>{domain.target_url}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {domain.ssl_enabled && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      SSL
                    </span>
                  )}
                  {domain.verified && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Verified
                    </span>
                  )}
                  {domain.active && (
                    <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Requests</div>
                  <div className="text-2xl font-bold">{domain.stats.total_requests.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Blocked</div>
                  <div className="text-2xl font-bold text-red-600">{domain.stats.total_blocked.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Bandwidth</div>
                  <div className="text-2xl font-bold">
                    {(domain.stats.bandwidth_used / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>

              {/* Subdomains */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Subdomains ({domain.subdomains?.length || 0})</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSubdomain(domain._id, domain.domain)}
                  >
                    Add Subdomain
                  </Button>
                </div>
                {domain.subdomains?.length > 0 && (
                  <div className="space-y-2">
                    {domain.subdomains.map((sub: any) => (
                      <div
                        key={sub.subdomain}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <div>
                          <div className="font-medium">{sub.full_domain}</div>
                          <div className="text-sm text-muted-foreground">{sub.target_url}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sub.request_count} requests
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WAF Rules */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">WAF Rules ({domain.waf_rules?.length || 0})</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddWAFRule(domain._id)}
                  >
                    Add WAF Rule
                  </Button>
                </div>
                {domain.waf_rules?.length > 0 && (
                  <div className="space-y-2">
                    {domain.waf_rules.map((rule: any) => (
                      <div
                        key={rule.name}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {rule.expression}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                            {rule.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Priority: {rule.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
