import mongoose from 'mongoose'

const UpstreamServerSchema = new mongoose.Schema({
  url: { type: String, required: true },
  weight: { type: Number, default: 1 },
  max_fails: { type: Number, default: 3 },
  fail_timeout: { type: Number, default: 30 },
  backup: { type: Boolean, default: false },
  down: { type: Boolean, default: false },
  health_status: { 
    type: String, 
    enum: ['healthy', 'unhealthy', 'unknown'], 
    default: 'unknown' 
  },
  last_health_check: { type: Date }
}, { _id: false })

const HealthCheckSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  interval: { type: Number, default: 30 }, // seconds
  timeout: { type: Number, default: 5 }, // seconds
  path: { type: String, default: '/' },
  expected_status: { type: Number, default: 200 },
  fall: { type: Number, default: 3 }, // consecutive failures
  rise: { type: Number, default: 2 } // consecutive successes
}, { _id: false })

const ProxyHeaderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false })

const PathRewriteSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  regex: { type: Boolean, default: false }
}, { _id: false })

const ProxyConfigSchema = new mongoose.Schema({
  team_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true, 
    index: true 
  },
  domain_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Domain', 
    required: true, 
    index: true 
  },
  name: { type: String, required: true },
  subdomain: { type: String }, // null for domain-level
  
  // Upstream configuration
  upstream_servers: [UpstreamServerSchema],
  load_balancing: {
    type: String,
    enum: ['round_robin', 'least_connections', 'ip_hash', 'weighted'],
    default: 'round_robin'
  },
  
  // Health checks
  health_check: { type: HealthCheckSchema, default: () => ({}) },
  
  // Timeouts
  connect_timeout: { type: Number, default: 60 }, // seconds
  send_timeout: { type: Number, default: 60 },
  read_timeout: { type: Number, default: 60 },
  
  // Connection settings
  keepalive_timeout: { type: Number, default: 75 },
  keepalive_requests: { type: Number, default: 100 },
  max_idle_connections: { type: Number, default: 100 },
  
  // SSL/TLS
  ssl_verify: { type: Boolean, default: true },
  ssl_protocols: { type: [String], default: ['TLSv1.2', 'TLSv1.3'] },
  
  // Headers
  custom_headers: [ProxyHeaderSchema],
  preserve_host: { type: Boolean, default: true },
  
  // Path rewriting
  path_rewrites: [PathRewriteSchema],
  strip_path: { type: Boolean, default: false },
  
  // Buffering
  buffer_requests: { type: Boolean, default: false },
  buffer_responses: { type: Boolean, default: false },
  buffer_size: { type: Number, default: 4096 }, // bytes
  
  // Retry logic
  retry_attempts: { type: Number, default: 0 },
  retry_timeout: { type: Number, default: 0 },
  
  // WebSocket support
  websocket_enabled: { type: Boolean, default: false },
  
  // Stats
  total_requests: { type: Number, default: 0 },
  total_errors: { type: Number, default: 0 },
  avg_response_time: { type: Number, default: 0 }, // milliseconds
  
  enabled: { type: Boolean, default: true }
}, {
  timestamps: true
})

// Indexes
ProxyConfigSchema.index({ team_id: 1, domain_id: 1 })
ProxyConfigSchema.index({ team_id: 1, enabled: 1 })

// Virtuals
ProxyConfigSchema.virtual('full_path').get(function() {
  return this.subdomain ? `${this.subdomain}.*` : '*'
})

ProxyConfigSchema.virtual('healthy_servers_count').get(function() {
  return this.upstream_servers.filter((s: any) => s.health_status === 'healthy' && !s.down).length
})

ProxyConfigSchema.virtual('total_servers_count').get(function() {
  return this.upstream_servers.length
})

// Methods
ProxyConfigSchema.methods.addUpstreamServer = function(server: any) {
  this.upstream_servers.push(server)
  return this.save()
}

ProxyConfigSchema.methods.removeUpstreamServer = function(url: string) {
  this.upstream_servers = this.upstream_servers.filter((s: any) => s.url !== url)
  return this.save()
}

ProxyConfigSchema.methods.updateServerHealth = function(url: string, status: 'healthy' | 'unhealthy' | 'unknown') {
  const server = this.upstream_servers.find((s: any) => s.url === url)
  if (server) {
    server.health_status = status
    server.last_health_check = new Date()
  }
  return this.save()
}

ProxyConfigSchema.methods.addHeader = function(name: string, value: string) {
  this.custom_headers.push({ name, value })
  return this.save()
}

ProxyConfigSchema.methods.removeHeader = function(name: string) {
  this.custom_headers = this.custom_headers.filter((h: any) => h.name !== name)
  return this.save()
}

ProxyConfigSchema.methods.addPathRewrite = function(from: string, to: string, regex: boolean = false) {
  this.path_rewrites.push({ from, to, regex })
  return this.save()
}

ProxyConfigSchema.methods.removePathRewrite = function(from: string) {
  this.path_rewrites = this.path_rewrites.filter((r: any) => r.from !== from)
  return this.save()
}

ProxyConfigSchema.methods.recordRequest = function(responseTime: number, error: boolean = false) {
  this.total_requests += 1
  if (error) this.total_errors += 1
  
  // Update average response time (exponential moving average)
  if (this.avg_response_time === 0) {
    this.avg_response_time = responseTime
  } else {
    this.avg_response_time = (this.avg_response_time * 0.9) + (responseTime * 0.1)
  }
  
  return this.save()
}

// Statics
ProxyConfigSchema.statics.findByTeam = function(teamId: string) {
  return this.find({ team_id: teamId }).populate('domain_id')
}

ProxyConfigSchema.statics.findByDomain = function(domainId: string) {
  return this.find({ domain_id: domainId })
}

ProxyConfigSchema.statics.findActiveConfigs = function(teamId: string) {
  return this.find({ team_id: teamId, enabled: true }).populate('domain_id')
}

const ProxyConfig = mongoose.models.ProxyConfig || mongoose.model('ProxyConfig', ProxyConfigSchema)

export default ProxyConfig
