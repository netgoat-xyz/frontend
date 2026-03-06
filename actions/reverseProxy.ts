'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import connectDB from '@/lib/mongoose'
import { Team } from '@/models/Team'
import ProxyConfig from '@/models/ProxyConfig'
import Domain from '@/models/Domain'

// Create proxy configuration
export async function createProxyConfig(
  teamSlug: string,
  domainId: string,
  config: {
    name: string
    subdomain?: string
    upstream_servers: Array<{ url: string; weight?: number }>
    load_balancing?: string
    health_check?: any
    connect_timeout?: number
    send_timeout?: number
    read_timeout?: number
    preserve_host?: boolean
    websocket_enabled?: boolean
  }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  // Find team and check membership
  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to create proxy configurations')
  }

  // Verify domain belongs to team
  const domain = await Domain.findOne({ _id: domainId, team_id: team._id })
  if (!domain) {
    throw new Error('Domain not found or does not belong to this team')
  }

  // Create proxy config
  const proxyConfig = await ProxyConfig.create({
    team_id: team._id,
    domain_id: domainId,
    ...config
  })

  return JSON.parse(JSON.stringify(proxyConfig))
}

// List proxy configurations for team
export async function listProxyConfigs(teamSlug: string, domainId?: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const isMember = team.members.some((m: any) => m.user_id.toString() === session.user.id)
  if (!isMember) {
    throw new Error('You are not a member of this team')
  }

  const query: any = { team_id: team._id }
  if (domainId) query.domain_id = domainId

  const configs = await ProxyConfig.find(query)
    .populate('domain_id')
    .sort({ created_at: -1 })

  return JSON.parse(JSON.stringify(configs))
}

// Get single proxy configuration
export async function getProxyConfig(teamSlug: string, configId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
    .populate('domain_id')

  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  return JSON.parse(JSON.stringify(config))
}

// Update proxy configuration
export async function updateProxyConfig(
  teamSlug: string,
  configId: string,
  updates: any
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to update proxy configurations')
  }

  const config = await ProxyConfig.findOneAndUpdate(
    { _id: configId, team_id: team._id },
    { $set: updates },
    { new: true }
  )

  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  return JSON.parse(JSON.stringify(config))
}

// Delete proxy configuration
export async function deleteProxyConfig(teamSlug: string, configId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to delete proxy configurations')
  }

  const result = await ProxyConfig.findOneAndDelete({
    _id: configId,
    team_id: team._id
  })

  if (!result) {
    throw new Error('Proxy configuration not found')
  }

  return { success: true }
}

// Add upstream server
export async function addUpstreamServer(
  teamSlug: string,
  configId: string,
  server: { url: string; weight?: number; max_fails?: number; fail_timeout?: number }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify upstream servers')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.addUpstreamServer(server)

  return JSON.parse(JSON.stringify(config))
}

// Remove upstream server
export async function removeUpstreamServer(
  teamSlug: string,
  configId: string,
  serverUrl: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify upstream servers')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.removeUpstreamServer(serverUrl)

  return JSON.parse(JSON.stringify(config))
}

// Add custom header
export async function addProxyHeader(
  teamSlug: string,
  configId: string,
  name: string,
  value: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify headers')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.addHeader(name, value)

  return JSON.parse(JSON.stringify(config))
}

// Remove custom header
export async function removeProxyHeader(
  teamSlug: string,
  configId: string,
  headerName: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify headers')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.removeHeader(headerName)

  return JSON.parse(JSON.stringify(config))
}

// Add path rewrite rule
export async function addPathRewrite(
  teamSlug: string,
  configId: string,
  from: string,
  to: string,
  regex: boolean = false
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify path rewrites')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.addPathRewrite(from, to, regex)

  return JSON.parse(JSON.stringify(config))
}

// Remove path rewrite rule
export async function removePathRewrite(
  teamSlug: string,
  configId: string,
  from: string
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify path rewrites')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  await config.removePathRewrite(from)

  return JSON.parse(JSON.stringify(config))
}

// Toggle server status (up/down)
export async function toggleServerStatus(
  teamSlug: string,
  configId: string,
  serverUrl: string,
  down: boolean
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const hasPermission = await Team.hasPermission(team, session.user.id, 'admin')
  if (!hasPermission) {
    throw new Error('You need admin permission to modify server status')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  const server = config.upstream_servers.find((s: any) => s.url === serverUrl)
  if (!server) {
    throw new Error('Server not found')
  }

  server.down = down
  await config.save()

  return JSON.parse(JSON.stringify(config))
}

// Trigger health check (simulated)
export async function triggerHealthCheck(teamSlug: string, configId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await connectDB()

  const team = await Team.findOne({ slug: teamSlug })
  if (!team) {
    throw new Error('Team not found')
  }

  const config = await ProxyConfig.findOne({ _id: configId, team_id: team._id })
  if (!config) {
    throw new Error('Proxy configuration not found')
  }

  // In a real implementation, this would trigger actual health checks via the agent
  // For now, we'll simulate by updating timestamps
  for (const server of config.upstream_servers) {
    server.last_health_check = new Date()
    // Randomly set health status (in reality this would be based on actual checks)
    server.health_status = Math.random() > 0.1 ? 'healthy' : 'unhealthy'
  }

  await config.save()

  return JSON.parse(JSON.stringify(config))
}
