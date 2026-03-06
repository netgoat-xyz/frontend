'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { listTeamDomains } from '@/actions/teamDomains'
import { createDNSRecord, listDNSRecords, updateDNSRecord, deleteDNSRecord, checkDNSPropagation, bulkImportDNS } from '@/actions/dns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Globe, Plus, Edit, Trash2, RefreshCw, Upload, Check, AlertCircle, Loader2 } from 'lucide-react'

type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'

interface DNSRecord {
  _id: string
  team_id: string
  domain_id: string
  name: string
  type: DNSRecordType
  value: string
  ttl: number
  priority?: number
  proxied: boolean
  propagation_status: 'pending' | 'propagated' | 'failed'
  last_checked?: Date
  created_at: Date
}

export default function DNSPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const teamSlug = params.teamName as string
  const selectedDomainId = searchParams.get('domain')

  const [domains, setDomains] = useState<any[]>([])
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null)

  const [newRecord, setNewRecord] = useState({
    name: '@',
    type: 'A' as DNSRecordType,
    value: '',
    ttl: 3600,
    priority: 10,
    proxied: true
  })

  const [zoneFileContent, setZoneFileContent] = useState('')

  useEffect(() => {
    loadDomains()
  }, [teamSlug])

  useEffect(() => {
    if (domains.length > 0) {
      if (selectedDomainId) {
        const domain = domains.find(d => d._id === selectedDomainId)
        if (domain) setSelectedDomain(domain)
      } else if (!selectedDomain) {
        setSelectedDomain(domains[0])
      }
    }
  }, [domains, selectedDomainId])

  useEffect(() => {
    if (selectedDomain) {
      loadDNSRecords()
    }
  }, [selectedDomain])

  const loadDomains = async () => {
    try {
      const result = await listTeamDomains(teamSlug)
      setDomains(result as any)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const loadDNSRecords = async () => {
    if (!selectedDomain) return

    try {
      setLoading(true)
      const result = await listDNSRecords(teamSlug, selectedDomain._id)
      setDnsRecords(result as DNSRecord[])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    if (!selectedDomain) {
      toast.error('Please select a domain')
      return
    }

    if (!newRecord.name || !newRecord.value) {
      toast.error('Name and value are required')
      return
    }

    try {
      setLoading(true)
      await createDNSRecord(teamSlug, {
        domain_id: selectedDomain._id,
        domain: selectedDomain.domain,
        type: newRecord.type,
        name: newRecord.name,
        value: newRecord.value,
        ttl: newRecord.ttl,
        priority: newRecord.priority,
        proxied: newRecord.proxied
      })
      toast.success('DNS record created')
      setNewRecord({ name: '@', type: 'A', value: '', ttl: 3600, priority: 10, proxied: true })
      setCreateOpen(false)
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRecord = async () => {
    if (!editingRecord) return

    try {
      setLoading(true)
      await updateDNSRecord(teamSlug, editingRecord._id, {
        name: editingRecord.name,
        value: editingRecord.value,
        ttl: editingRecord.ttl,
        priority: editingRecord.priority,
        proxied: editingRecord.proxied
      })
      toast.success('DNS record updated')
      setEditingRecord(null)
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Delete this DNS record?')) return

    try {
      setLoading(true)
      await deleteDNSRecord(teamSlug, recordId)
      toast.success('DNS record deleted')
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckPropagation = async (recordId: string) => {
    try {
      const result = await checkDNSPropagation(teamSlug, recordId)
      if (result.propagated) {
        toast.success('DNS record has propagated')
      } else {
        toast.info('DNS record is still propagating...')
      }
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const parseZoneFile = (content: string) => {
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('#')
    })

    const records: Array<{
      type: string
      name: string
      value: string
      ttl?: number
      priority?: number
    }> = []

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 4) continue

      let name = parts[0]
      let ttl: number | undefined
      let recordClass = 'IN'
      let type = ''
      let value = ''
      let priority: number | undefined

      // Parse: name [ttl] [class] type value [priority]
      let idx = 1
      
      // Check if second part is TTL (numeric)
      if (!isNaN(parseInt(parts[idx]))) {
        ttl = parseInt(parts[idx])
        idx++
      }

      // Skip class (IN, CH, HS)
      if (parts[idx] === 'IN' || parts[idx] === 'CH' || parts[idx] === 'HS') {
        idx++
      }

      // Type
      type = parts[idx]
      idx++

      // Priority for MX records
      if (type === 'MX' && !isNaN(parseInt(parts[idx]))) {
        priority = parseInt(parts[idx])
        idx++
      }

      // Value (rest of the line)
      value = parts.slice(idx).join(' ').replace(/\.$/,'') // Remove trailing dot

      // Clean up name
      if (name.endsWith('.')) {
        name = name.slice(0, -1)
      }
      if (name === '@' || name === selectedDomain?.domain) {
        name = '@'
      } else if (name.endsWith('.' + selectedDomain?.domain)) {
        name = name.replace('.' + selectedDomain?.domain, '')
      }

      records.push({ type, name, value, ttl, priority })
    }

    return records
  }

  const handleBulkImport = async () => {
    if (!selectedDomain || !zoneFileContent.trim()) {
      toast.error('Domain and zone file content are required')
      return
    }

    try {
      setLoading(true)
      const parsedRecords = parseZoneFile(zoneFileContent)
      if (parsedRecords.length === 0) {
        toast.error('No valid DNS records found in zone file')
        setLoading(false)
        return
      }
      const result = await bulkImportDNS(teamSlug, selectedDomain._id, parsedRecords)
      toast.success(`Imported ${result.success} DNS records${result.failed > 0 ? `, ${result.failed} failed` : ''}`)
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors)
      }
      setZoneFileContent('')
      setImportOpen(false)
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const recordTypeInfo: Record<DNSRecordType, { placeholder: string; description: string }> = {
    A: { placeholder: '192.0.2.1', description: 'IPv4 address' },
    AAAA: { placeholder: '2001:0db8::1', description: 'IPv6 address' },
    CNAME: { placeholder: 'example.com', description: 'Canonical name (alias)' },
    MX: { placeholder: 'mail.example.com', description: 'Mail server (requires priority)' },
    TXT: { placeholder: 'v=spf1 include:_spf.example.com ~all', description: 'Text record' },
    NS: { placeholder: 'ns1.example.com', description: 'Name server' },
    SRV: { placeholder: '10 5 5060 sip.example.com', description: 'Service record' },
    CAA: { placeholder: '0 issue "letsencrypt.org"', description: 'Certificate authority' }
  }

  const filteredRecords = filterType === 'all'
    ? dnsRecords
    : dnsRecords.filter(r => r.type === filterType)

  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.type]) acc[record.type] = []
    acc[record.type].push(record)
    return acc
  }, {} as Record<string, DNSRecord[]>)

  if (domains.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DNS Records</h1>
          <p className="text-muted-foreground mt-2">Manage DNS records for your domains</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add a domain first to manage DNS records
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
          <h1 className="text-3xl font-bold">DNS Records</h1>
          <p className="text-muted-foreground mt-2">
            Manage DNS records for your domains
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Zone File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
              <DialogHeader>
                <DialogTitle>Import DNS Zone File</DialogTitle>
                <DialogDescription>
                  Paste your zone file content to bulk import DNS records
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Textarea
                  placeholder="example.com. 3600 IN A 192.0.2.1&#10;www 3600 IN CNAME example.com.&#10;mail 3600 IN MX 10 mail.example.com."
                  rows={12}
                  value={zoneFileContent}
                  onChange={(e) => setZoneFileContent(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={handleBulkImport} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import Records
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
              <DialogHeader>
                <DialogTitle>Add DNS Record</DialogTitle>
                <DialogDescription>
                  Create a new DNS record for {selectedDomain?.domain}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="record-type">Type</Label>
                    <Select
                      value={newRecord.type}
                      onValueChange={(v) => v && setNewRecord({ ...newRecord, type: v as DNSRecordType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A (IPv4)</SelectItem>
                        <SelectItem value="AAAA">AAAA (IPv6)</SelectItem>
                        <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                        <SelectItem value="MX">MX (Mail)</SelectItem>
                        <SelectItem value="TXT">TXT (Text)</SelectItem>
                        <SelectItem value="NS">NS (Name Server)</SelectItem>
                        <SelectItem value="SRV">SRV (Service)</SelectItem>
                        <SelectItem value="CAA">CAA (Certificate)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recordTypeInfo[newRecord.type].description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="record-name">Name</Label>
                    <Input
                      id="record-name"
                      placeholder="@ or subdomain"
                      value={newRecord.name}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      @ = root domain
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="record-value">Value</Label>
                  <Input
                    id="record-value"
                    placeholder={recordTypeInfo[newRecord.type].placeholder}
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="record-ttl">TTL (seconds)</Label>
                    <Input
                      id="record-ttl"
                      type="number"
                      value={newRecord.ttl}
                      onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: 3600 (1 hour)
                    </p>
                  </div>
                  {(newRecord.type === 'MX' || newRecord.type === 'SRV') && (
                    <div>
                      <Label htmlFor="record-priority">Priority</Label>
                      <Input
                        id="record-priority"
                        type="number"
                        value={newRecord.priority}
                        onChange={(e) => setNewRecord({ ...newRecord, priority: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="proxied"
                    checked={newRecord.proxied}
                    onCheckedChange={(checked) => setNewRecord({ ...newRecord, proxied: checked })}
                  />
                  <Label htmlFor="proxied" className="cursor-pointer">
                    Proxied (requests go through NetGoat)
                  </Label>
                </div>

                <Button onClick={handleCreateRecord} disabled={loading} className="w-full">
                  Create DNS Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domain Selector & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Domain</Label>
              <Select
                value={selectedDomain?._id}
                onValueChange={(domainId) => {
                  const domain = domains.find(d => d._id === domainId)
                  setSelectedDomain(domain)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain._id} value={domain._id}>
                      {domain.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Record Type Filter</Label>
              <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="A">A Records</SelectItem>
                  <SelectItem value="AAAA">AAAA Records</SelectItem>
                  <SelectItem value="CNAME">CNAME Records</SelectItem>
                  <SelectItem value="MX">MX Records</SelectItem>
                  <SelectItem value="TXT">TXT Records</SelectItem>
                  <SelectItem value="NS">NS Records</SelectItem>
                  <SelectItem value="SRV">SRV Records</SelectItem>
                  <SelectItem value="CAA">CAA Records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DNS Records */}
      {loading && dnsRecords.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No DNS records</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filterType !== 'all' ? `No ${filterType} records found` : 'Add your first DNS record to get started'}
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add DNS Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([type, records]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-lg">{type} Records ({records.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {records.map((record) => (
                    <div key={record._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <code className="font-mono text-sm font-semibold">{record.name}</code>
                            <Badge variant="outline">{record.type}</Badge>
                            {record.proxied && (
                              <Badge variant="secondary">Proxied</Badge>
                            )}
                            <Badge variant={
                              record.propagation_status === 'propagated' ? 'default' :
                              record.propagation_status === 'failed' ? 'destructive' : 'secondary'
                            }>
                              {record.propagation_status === 'propagated' && <Check className="w-3 h-3 mr-1" />}
                              {record.propagation_status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {record.propagation_status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>→ <code className="font-mono">{record.value}</code></span>
                            <span>TTL: {record.ttl}s</span>
                            {record.priority && <span>Priority: {record.priority}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCheckPropagation(record._id)}
                            title="Check propagation"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRecord(record._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Edit DNS Record</DialogTitle>
            <DialogDescription>
              Update the DNS record for {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Input value={editingRecord.type} disabled className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingRecord.name}
                    onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  value={editingRecord.value}
                  onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ttl">TTL (seconds)</Label>
                  <Input
                    id="edit-ttl"
                    type="number"
                    value={editingRecord.ttl}
                    onChange={(e) => setEditingRecord({ ...editingRecord, ttl: parseInt(e.target.value) || 3600 })}
                  />
                </div>
                {(editingRecord.type === 'MX' || editingRecord.type === 'SRV') && (
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Input
                      id="edit-priority"
                      type="number"
                      value={editingRecord.priority}
                      onChange={(e) => setEditingRecord({ ...editingRecord, priority: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-proxied"
                  checked={editingRecord.proxied}
                  onCheckedChange={(checked) => setEditingRecord({ ...editingRecord, proxied: checked })}
                />
                <Label htmlFor="edit-proxied" className="cursor-pointer">
                  Proxied (requests go through NetGoat)
                </Label>
              </div>

              <Button onClick={handleUpdateRecord} disabled={loading} className="w-full">
                Update DNS Record
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
