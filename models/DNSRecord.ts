import mongoose, { Schema, model, models, Model } from 'mongoose'

export interface IDNSRecord {
  _id: mongoose.Types.ObjectId
  team_id: mongoose.Types.ObjectId
  domain_id: mongoose.Types.ObjectId
  domain: string // The full domain this record applies to
  
  // DNS Record Details
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'
  name: string // Subdomain or @ for root
  value: string // IP, hostname, or text content
  ttl: number // Time to live in seconds
  priority?: number // For MX and SRV records
  
  // Proxy settings (Cloudflare-style)
  proxied: boolean // Whether to proxy through NetGoat
  
  // Status
  active: boolean
  propagated: boolean // Whether DNS has propagated
  last_checked: Date
  
  // Metadata
  created_at: Date
  updated_at: Date
  created_by: mongoose.Types.ObjectId
  
  // Instance Methods
  checkPropagation(): Promise<boolean>
}

const DNSRecordSchema = new Schema<IDNSRecord>({
  team_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  domain_id: { type: Schema.Types.ObjectId, ref: 'Domain', required: true, index: true },
  domain: { type: String, required: true, index: true },
  
  type: { 
    type: String, 
    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'], 
    required: true 
  },
  name: { type: String, required: true }, // @ for root, or subdomain like 'www' or 'api'
  value: { type: String, required: true },
  ttl: { type: Number, default: 3600 },
  priority: { type: Number },
  
  proxied: { type: Boolean, default: false },
  
  active: { type: Boolean, default: true },
  propagated: { type: Boolean, default: false },
  last_checked: { type: Date },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})

// Compound indexes
DNSRecordSchema.index({ domain: 1, type: 1, name: 1 })
DNSRecordSchema.index({ team_id: 1, domain: 1 })
DNSRecordSchema.index({ domain_id: 1 })

// Virtuals
DNSRecordSchema.virtual('full_name').get(function() {
  if (this.name === '@' || this.name === '') {
    return this.domain
  }
  return `${this.name}.${this.domain}`
})

// Instance Methods
DNSRecordSchema.methods.checkPropagation = async function() {
  // In production, this would query actual DNS servers
  // For now, we'll simulate it
  this.last_checked = new Date()
  
  // Simulate propagation after 5 minutes
  const minutesSinceCreation = (Date.now() - this.created_at.getTime()) / 1000 / 60
  this.propagated = minutesSinceCreation >= 5
  
  await this.save()
  return this.propagated
}

// Static Methods
DNSRecordSchema.statics.findByDomain = async function(domain: string, activeOnly = true) {
  const query: any = { domain }
  if (activeOnly) {
    query.active = true
  }
  return this.find(query).sort({ type: 1, name: 1 })
}

DNSRecordSchema.statics.findByTeam = async function(teamId: string, activeOnly = true) {
  const query: any = { team_id: new mongoose.Types.ObjectId(teamId) }
  if (activeOnly) {
    query.active = true
  }
  return this.find(query).sort({ domain: 1, type: 1, name: 1 })
}

DNSRecordSchema.statics.findByDomainId = async function(domainId: string, activeOnly = true) {
  const query: any = { domain_id: new mongoose.Types.ObjectId(domainId) }
  if (activeOnly) {
    query.active = true
  }
  return this.find(query).sort({ type: 1, name: 1 })
}

DNSRecordSchema.statics.validateRecord = function(type: string, value: string) {
  const patterns: Record<string, RegExp> = {
    A: /^(\d{1,3}\.){3}\d{1,3}$/,
    AAAA: /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/,
    CNAME: /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/,
    MX: /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/,
    // TXT, NS, SRV, CAA are more flexible
  }
  
  if (patterns[type]) {
    return patterns[type].test(value)
  }
  
  return true // For TXT and other flexible types
}

// Model interface with static methods
interface IDNSRecordModel extends Model<IDNSRecord> {
  findByDomain(domain: string, activeOnly?: boolean): Promise<IDNSRecord[]>
  findByTeam(teamId: string, activeOnly?: boolean): Promise<IDNSRecord[]>
  findByDomainId(domainId: string, activeOnly?: boolean): Promise<IDNSRecord[]>
  validateRecord(type: string, value: string): boolean
}

export const DNSRecord = (models.DNSRecord || model<IDNSRecord, IDNSRecordModel>('DNSRecord', DNSRecordSchema)) as IDNSRecordModel

export default DNSRecord
