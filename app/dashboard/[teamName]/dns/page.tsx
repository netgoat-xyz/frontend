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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('DashboardPages.teamDns')
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
      toast.error(t('errors.selectDomain'))
      return
    }

    if (!newRecord.name || !newRecord.value) {
      toast.error(t('errors.nameValueRequired'))
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
      toast.success(t('toasts.created'))
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
      toast.success(t('toasts.updated'))
      setEditingRecord(null)
      await loadDNSRecords()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm(t('confirm.deleteRecord'))) return

    try {
      setLoading(true)
      await deleteDNSRecord(teamSlug, recordId)
      toast.success(t('toasts.deleted'))
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
        toast.success(t('toasts.propagated'))
      } else {
        toast.info(t('toasts.stillPropagating'))
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
      toast.error(t('errors.zoneRequired'))
      return
    }

    try {
      setLoading(true)
      const parsedRecords = parseZoneFile(zoneFileContent)
      if (parsedRecords.length === 0) {
        toast.error(t('errors.noValidRecords'))
        setLoading(false)
        return
      }
      const result = await bulkImportDNS(teamSlug, selectedDomain._id, parsedRecords)
      toast.success(t('toasts.imported', { success: result.success, failed: result.failed }))
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
    A: { placeholder: t('typeInfo.a.placeholder'), description: t('typeInfo.a.description') },
    AAAA: { placeholder: t('typeInfo.aaaa.placeholder'), description: t('typeInfo.aaaa.description') },
    CNAME: { placeholder: t('typeInfo.cname.placeholder'), description: t('typeInfo.cname.description') },
    MX: { placeholder: t('typeInfo.mx.placeholder'), description: t('typeInfo.mx.description') },
    TXT: { placeholder: t('typeInfo.txt.placeholder'), description: t('typeInfo.txt.description') },
    NS: { placeholder: t('typeInfo.ns.placeholder'), description: t('typeInfo.ns.description') },
    SRV: { placeholder: t('typeInfo.srv.placeholder'), description: t('typeInfo.srv.description') },
    CAA: { placeholder: t('typeInfo.caa.placeholder'), description: t('typeInfo.caa.description') }
  }

  const translatePropagationStatus = (status: DNSRecord['propagation_status']) => {
    if (status === 'propagated') return t('status.propagated')
    if (status === 'failed') return t('status.failed')
    return t('status.pending')
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('emptyDomainsTitle')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('emptyDomains')}
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {t('actions.importZone')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
              <DialogHeader>
                <DialogTitle>{t('dialogs.import.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.import.description')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Textarea
                  placeholder={t('zonePlaceholder')}
                  rows={12}
                  value={zoneFileContent}
                  onChange={(e) => setZoneFileContent(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={handleBulkImport} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {t('actions.importRecords')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('actions.addRecord')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150">
              <DialogHeader>
                <DialogTitle>{t('dialogs.add.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.add.description', { domain: selectedDomain?.domain || '' })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="record-type">{t('fields.type')}</Label>
                    <Select
                      value={newRecord.type}
                      onValueChange={(v) => v && setNewRecord({ ...newRecord, type: v as DNSRecordType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">{t('recordTypeOptions.A')}</SelectItem>
                        <SelectItem value="AAAA">{t('recordTypeOptions.AAAA')}</SelectItem>
                        <SelectItem value="CNAME">{t('recordTypeOptions.CNAME')}</SelectItem>
                        <SelectItem value="MX">{t('recordTypeOptions.MX')}</SelectItem>
                        <SelectItem value="TXT">{t('recordTypeOptions.TXT')}</SelectItem>
                        <SelectItem value="NS">{t('recordTypeOptions.NS')}</SelectItem>
                        <SelectItem value="SRV">{t('recordTypeOptions.SRV')}</SelectItem>
                        <SelectItem value="CAA">{t('recordTypeOptions.CAA')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recordTypeInfo[newRecord.type].description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="record-name">{t('fields.name')}</Label>
                    <Input
                      id="record-name"
                      placeholder={t('fields.namePlaceholder')}
                      value={newRecord.name}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('fields.rootHint')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="record-value">{t('fields.value')}</Label>
                  <Input
                    id="record-value"
                    placeholder={recordTypeInfo[newRecord.type].placeholder}
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="record-ttl">{t('fields.ttl')}</Label>
                    <Input
                      id="record-ttl"
                      type="number"
                      value={newRecord.ttl}
                      onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('fields.ttlHint')}
                    </p>
                  </div>
                  {(newRecord.type === 'MX' || newRecord.type === 'SRV') && (
                    <div>
                      <Label htmlFor="record-priority">{t('fields.priority')}</Label>
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
                    {t('fields.proxied')}
                  </Label>
                </div>

                <Button onClick={handleCreateRecord} disabled={loading} className="w-full">
                  {t('actions.createDnsRecord')}
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
              <Label className="mb-2 block">{t('filters.domain')}</Label>
              <Select
                value={selectedDomain?._id}
                onValueChange={(domainId) => {
                  const domain = domains.find(d => d._id === domainId)
                  setSelectedDomain(domain)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.selectDomain')} />
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
              <Label className="mb-2 block">{t('filters.recordType')}</Label>
              <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.typeOptions.all')}</SelectItem>
                  <SelectItem value="A">{t('filters.typeOptions.A')}</SelectItem>
                  <SelectItem value="AAAA">{t('filters.typeOptions.AAAA')}</SelectItem>
                  <SelectItem value="CNAME">{t('filters.typeOptions.CNAME')}</SelectItem>
                  <SelectItem value="MX">{t('filters.typeOptions.MX')}</SelectItem>
                  <SelectItem value="TXT">{t('filters.typeOptions.TXT')}</SelectItem>
                  <SelectItem value="NS">{t('filters.typeOptions.NS')}</SelectItem>
                  <SelectItem value="SRV">{t('filters.typeOptions.SRV')}</SelectItem>
                  <SelectItem value="CAA">{t('filters.typeOptions.CAA')}</SelectItem>
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
            <h3 className="text-lg font-semibold mb-2">{t('emptyRecordsTitle')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filterType !== 'all' ? t('emptyFilter', { type: filterType }) : t('emptyRecords')}
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('actions.addDnsRecord')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([type, records]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-lg">{t('records.groupTitle', { type, count: records.length })}</CardTitle>
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
                              <Badge variant="secondary">{t('status.proxied')}</Badge>
                            )}
                            <Badge variant={
                              record.propagation_status === 'propagated' ? 'default' :
                              record.propagation_status === 'failed' ? 'destructive' : 'secondary'
                            }>
                              {record.propagation_status === 'propagated' && <Check className="w-3 h-3 mr-1" />}
                              {record.propagation_status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {translatePropagationStatus(record.propagation_status)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>→ <code className="font-mono">{record.value}</code></span>
                            <span>{t('records.ttl')}: {record.ttl}s</span>
                            {record.priority && <span>{t('records.priority')}: {record.priority}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCheckPropagation(record._id)}
                            title={t('actions.checkPropagation')}
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
            <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.edit.description', { domain: selectedDomain?.domain || '' })}
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('fields.type')}</Label>
                  <Input value={editingRecord.type} disabled className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="edit-name">{t('fields.name')}</Label>
                  <Input
                    id="edit-name"
                    value={editingRecord.name}
                    onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-value">{t('fields.value')}</Label>
                <Input
                  id="edit-value"
                  value={editingRecord.value}
                  onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ttl">{t('fields.ttl')}</Label>
                  <Input
                    id="edit-ttl"
                    type="number"
                    value={editingRecord.ttl}
                    onChange={(e) => setEditingRecord({ ...editingRecord, ttl: parseInt(e.target.value) || 3600 })}
                  />
                </div>
                {(editingRecord.type === 'MX' || editingRecord.type === 'SRV') && (
                  <div>
                    <Label htmlFor="edit-priority">{t('fields.priority')}</Label>
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
                  {t('fields.proxied')}
                </Label>
              </div>

              <Button onClick={handleUpdateRecord} disabled={loading} className="w-full">
                {t('actions.updateDnsRecord')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
