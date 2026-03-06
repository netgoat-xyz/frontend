'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { listTeamDomains, addDomainWAFRule, removeDomainWAFRule, addSubdomainWAFRule, removeSubdomainWAFRule } from '@/actions/teamDomains'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Shield, Plus, Trash2, AlertTriangle, Check, Info } from 'lucide-react'

interface WAFRule {
  name: string
  expression: string
  action: 'BLOCK' | 'ALLOW' | 'LOG'
  priority: number
  enabled: boolean
  description?: string
}

export default function WAFPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const teamSlug = params.teamName as string
  const selectedDomainId = searchParams.get('domain')

  const [domains, setDomains] = useState<any[]>([])
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null)
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [newRule, setNewRule] = useState({
    name: '',
    expression: '',
    action: 'BLOCK' as 'BLOCK' | 'ALLOW' | 'LOG',
    priority: 10,
    description: ''
  })

  useEffect(() => {
    loadDomains()
  }, [teamSlug])

  useEffect(() => {
    if (domains.length > 0 && selectedDomainId) {
      const domain = domains.find(d => d._id === selectedDomainId)
      if (domain) setSelectedDomain(domain)
    }
  }, [domains, selectedDomainId])

  const loadDomains = async () => {
    try {
      setLoading(true)
      const result = await listTeamDomains(teamSlug)
      setDomains(result as any)
      if (result.length > 0 && !selectedDomain) {
        setSelectedDomain(result[0])
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!selectedDomain) {
      toast.error('Please select a domain')
      return
    }

    if (!newRule.name || !newRule.expression) {
      toast.error('Name and expression are required')
      return
    }

    try {
      setLoading(true)
      
      if (selectedSubdomain) {
        await addSubdomainWAFRule(teamSlug, selectedDomain._id, selectedSubdomain, newRule)
        toast.success(`WAF rule added to ${selectedSubdomain}.${selectedDomain.domain}`)
      } else {
        await addDomainWAFRule(teamSlug, selectedDomain._id, newRule)
        toast.success('WAF rule added to domain')
      }

      setNewRule({ name: '', expression: '', action: 'BLOCK', priority: 10, description: '' })
      setCreateOpen(false)
      await loadDomains()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRule = async (ruleName: string, subdomain?: string) => {
    if (!selectedDomain) return

    if (!confirm(`Delete WAF rule "${ruleName}"?`)) return

    try {
      setLoading(true)
      
      if (subdomain) {
        await removeSubdomainWAFRule(teamSlug, selectedDomain._id, subdomain, ruleName)
      } else {
        await removeDomainWAFRule(teamSlug, selectedDomain._id, ruleName)
      }

      toast.success('WAF rule deleted')
      await loadDomains()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const ruleExamples = [
    {
      name: 'SQL Injection Protection',
      expression: "contains(request.path, 'SELECT') || contains(request.path, 'UNION') || contains(request.path, 'DROP')",
      action: 'BLOCK' as const,
      priority: 10
    },
    {
      name: 'XSS Protection',
      expression: "contains(request.path, '<script>') || contains(request.query_string, '<script>')",
      action: 'BLOCK' as const,
      priority: 9
    },
    {
      name: 'Rate Limiting',
      expression: "request.rate > 100",
      action: 'BLOCK' as const,
      priority: 5
    },
    {
      name: 'Geographic Block',
      expression: "request.country == 'CN' || request.country == 'RU'",
      action: 'BLOCK' as const,
      priority: 8
    },
    {
      name: 'Bot Detection',
      expression: "contains(request.user_agent, 'bot') || contains(request.user_agent, 'crawler')",
      action: 'LOG' as const,
      priority: 3
    }
  ]

  const useExample = (example: typeof ruleExamples[0]) => {
    setNewRule({
      name: example.name,
      expression: example.expression,
      action: example.action,
      priority: example.priority,
      description: ''
    })
  }

  if (loading && domains.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading WAF configuration...</p>
        </div>
      </div>
    )
  }

  if (domains.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">WAF Rules</h1>
          <p className="text-muted-foreground mt-2">Web Application Firewall configuration</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add a domain first to configure WAF rules
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">WAF Rules</h1>
          <p className="text-muted-foreground mt-2">
            Configure Web Application Firewall rules to protect your domains
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add WAF Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add WAF Rule</DialogTitle>
              <DialogDescription>
                Create a custom WAF rule to protect against threats
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="block-sql-injection"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={newRule.action} onValueChange={(v: any) => setNewRule({ ...newRule, action: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BLOCK">Block (deny request)</SelectItem>
                      <SelectItem value="ALLOW">Allow (permit request)</SelectItem>
                      <SelectItem value="LOG">Log (allow but record)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expression">Expression</Label>
                <Textarea
                  id="expression"
                  placeholder="contains(request.path, 'SELECT')"
                  rows={4}
                  value={newRule.expression}
                  onChange={(e) => setNewRule({ ...newRule, expression: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use functions like contains(), matches(), startsWith(), endsWith()
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Higher = evaluated first</p>
                </div>
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Select value={selectedSubdomain || 'domain'} onValueChange={(v) => setSelectedSubdomain(v === 'domain' ? null : v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domain">Domain-level</SelectItem>
                      {selectedDomain?.subdomains?.map((sub: any) => (
                        <SelectItem key={sub.subdomain} value={sub.subdomain}>
                          {sub.full_domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this rule does"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>

              {/* Examples */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">Quick Examples</Label>
                <div className="grid gap-2">
                  {ruleExamples.map((example) => (
                    <Button
                      key={example.name}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => useExample(example)}
                    >
                      <div className="w-full">
                        <div className="font-semibold text-sm">{example.name}</div>
                        <code className="text-xs text-muted-foreground font-mono">
                          {example.expression.substring(0, 60)}...
                        </code>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateRule} disabled={loading} className="w-full">
                Create WAF Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domain Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label className="min-w-fit">Select Domain:</Label>
            <Select
              value={selectedDomain?._id}
              onValueChange={(domainId) => {
                const domain = domains.find(d => d._id === domainId)
                setSelectedDomain(domain)
                setSelectedSubdomain(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain._id} value={domain._id}>
                    {domain.domain} ({domain.waf_rules?.length || 0} rules)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedDomain && (
        <Tabs defaultValue="domain" className="space-y-4">
          <TabsList>
            <TabsTrigger value="domain">
              Domain Rules ({selectedDomain.waf_rules?.length || 0})
            </TabsTrigger>
            {selectedDomain.subdomains?.map((sub: any) => (
              <TabsTrigger key={sub.subdomain} value={sub.subdomain}>
                {sub.subdomain} ({sub.waf_rules?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="domain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Domain-Level WAF Rules</CardTitle>
                <CardDescription>
                  These rules apply to {selectedDomain.domain} and all its subdomains
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDomain.waf_rules?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDomain.waf_rules
                      .sort((a: WAFRule, b: WAFRule) => b.priority - a.priority)
                      .map((rule: WAFRule) => (
                        <div key={rule.name} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold">{rule.name}</h4>
                                <Badge variant={
                                  rule.action === 'BLOCK' ? 'destructive' :
                                  rule.action === 'LOG' ? 'secondary' : 'outline'
                                }>
                                  {rule.action}
                                </Badge>
                                <Badge variant="outline">
                                  Priority: {rule.priority}
                                </Badge>
                              </div>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                              )}
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono block mt-2">
                                {rule.expression}
                              </code>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRule(rule.name)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No WAF rules configured for this domain</p>
                    <Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>
                      Add First Rule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  WAF Expression Language
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Available Properties:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li><code>request.path</code> - URL path (e.g., /api/users)</li>
                  <li><code>request.method</code> - HTTP method (GET, POST, etc.)</li>
                  <li><code>request.ip</code> - Client IP address</li>
                  <li><code>request.country</code> - Country code</li>
                  <li><code>request.user_agent</code> - User-Agent header</li>
                  <li><code>request.rate</code> - Requests per second</li>
                </ul>
                <p className="mt-4"><strong>Functions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground font-mono text-xs">
                  <li>contains(string, substring)</li>
                  <li>matches(string, regex)</li>
                  <li>startsWith(string, prefix)</li>
                  <li>endsWith(string, suffix)</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {selectedDomain.subdomains?.map((subdomain: any) => (
            <TabsContent key={subdomain.subdomain} value={subdomain.subdomain} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>WAF Rules for {subdomain.full_domain}</CardTitle>
                  <CardDescription>
                    Subdomain-specific rules in addition to domain-level rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subdomain.waf_rules?.length > 0 ? (
                    <div className="space-y-3">
                      {subdomain.waf_rules
                        .sort((a: WAFRule, b: WAFRule) => b.priority - a.priority)
                        .map((rule: WAFRule) => (
                          <div key={rule.name} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold">{rule.name}</h4>
                                  <Badge variant={
                                    rule.action === 'BLOCK' ? 'destructive' :
                                    rule.action === 'LOG' ? 'secondary' : 'outline'
                                  }>
                                    {rule.action}
                                  </Badge>
                                  <Badge variant="outline">
                                    Priority: {rule.priority}
                                  </Badge>
                                </div>
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono block mt-2">
                                  {rule.expression}
                                </code>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRule(rule.name, subdomain.subdomain)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No subdomain-specific WAF rules</p>
                      <p className="text-sm mt-2">Domain-level rules still apply</p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => {
                          setSelectedSubdomain(subdomain.subdomain)
                          setCreateOpen(true)
                        }}
                      >
                        Add Subdomain Rule
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
