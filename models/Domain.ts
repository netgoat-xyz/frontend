import mongoose from "mongoose";

const SubdomainWAFRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  expression: { type: String, required: true },
  action: { type: String, enum: ['BLOCK', 'ALLOW', 'LOG'], default: 'BLOCK' },
  priority: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const SubdomainSchema = new mongoose.Schema({
  subdomain: { type: String, required: true }, // e.g., "api", "blog", "app"
  full_domain: { type: String, required: true }, // e.g., "api.example.com"
  target_url: { type: String, required: true },
  active: { type: Boolean, default: true },
  certificate_pem: String,
  private_key_pem: String,
  
  // Subdomain-specific WAF rules
  waf_rules: [SubdomainWAFRuleSchema],
  
  // Stats
  request_count: { type: Number, default: 0 },
  blocked_count: { type: Number, default: 0 },
  last_accessed: Date,
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const DomainWAFRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  expression: { type: String, required: true },
  action: { type: String, enum: ['BLOCK', 'ALLOW', 'LOG'], default: 'BLOCK' },
  priority: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  description: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const DomainSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Legacy support
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true }, // Team-based ownership
  
  // Domain info
  domain: { type: String, required: true }, // e.g., "example.com"
  target_url: String, // Default target for the root domain
  
  // SSL/TLS
  certificate_pem: String,
  private_key_pem: String,
  ssl_enabled: { type: Boolean, default: false },
  auto_ssl: { type: Boolean, default: false },
  
  // Status
  active: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  verification_token: String,
  last_verification_check: Date,
  verification_attempts: { type: Number, default: 0 },
  next_verification_check: Date,
  
  // Global WAF rules for this domain (applies to all subdomains unless overridden)
  waf_rules: [DomainWAFRuleSchema],
  
  // Subdomains
  subdomains: [SubdomainSchema],
  
  // Settings
  settings: {
    rate_limit: { type: Number, default: 100 }, // requests per minute
    cache_enabled: { type: Boolean, default: true },
    cache_ttl: { type: Number, default: 300 }, // seconds
    compression_enabled: { type: Boolean, default: true },
    log_level: { type: String, enum: ['none', 'errors', 'all'], default: 'errors' }
  },
  
  // Stats
  stats: {
    total_requests: { type: Number, default: 0 },
    total_blocked: { type: Number, default: 0 },
    bandwidth_used: { type: Number, default: 0 }, // bytes
    last_request: Date
  },
  
  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { 
  collection: "domains",
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
// Use partial unique indexes so uniqueness is enforced only when the owner field exists.
// This avoids collisions where `user_id` is null for team-owned domains.
DomainSchema.index(
  { user_id: 1, domain: 1 },
  { unique: true, partialFilterExpression: { user_id: { $exists: true, $ne: null } } }
);
DomainSchema.index(
  { team_id: 1, domain: 1 },
  { unique: true, partialFilterExpression: { team_id: { $exists: true, $ne: null } } }
);
DomainSchema.index({ domain: 1 });
DomainSchema.index({ 'subdomains.full_domain': 1 });

// Methods
DomainSchema.methods.addSubdomain = function(subdomain: string, targetUrl: string) {
  const fullDomain = `${subdomain}.${this.domain}`;
  this.subdomains.push({
    subdomain,
    full_domain: fullDomain,
    target_url: targetUrl,
    active: true
  });
  return this.save();
};

DomainSchema.methods.removeSubdomain = function(subdomain: string) {
  this.subdomains = this.subdomains.filter((s: any) => s.subdomain !== subdomain);
  return this.save();
};

DomainSchema.methods.addWAFRule = function(rule: any) {
  this.waf_rules.push(rule);
  return this.save();
};

DomainSchema.methods.addSubdomainWAFRule = function(subdomain: string, rule: any) {
  const sub = this.subdomains.find((s: any) => s.subdomain === subdomain);
  if (sub) {
    sub.waf_rules.push(rule);
    return this.save();
  }
  throw new Error('Subdomain not found');
};

// Statics
DomainSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId, active: true });
};

DomainSchema.statics.findByDomain = function(domain: string) {
  return this.findOne({ domain, active: true });
};

DomainSchema.statics.countByUserId = function(userId: string) {
  return this.countDocuments({ user_id: userId, active: true });
};

export default mongoose.models.Domain || mongoose.model("Domain", DomainSchema);
