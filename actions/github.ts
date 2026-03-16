'use server'

import crypto from 'crypto'
import { generateChangelogSummaryWithOpenAI } from "@/lib/openai-wrapper"
import dbConnect from '@/lib/mongoose'
import ReleaseSummary from '@/models/ReleaseSummary'

/**
 * GitHub Actions
 * Fetches repository statistics and release data from GitHub API.
 */

interface GitHubStats {
  stars: number
  commits: number
  contributors: number
  lastUpdated: string
}

export type GitHubReleaseCategory = 'main-agent' | 'frontend'

export interface GitHubRelease {
  id: number
  tagName: string
  name: string
  body: string
  htmlUrl: string
  publishedAt: string
  createdAt: string
  authorLogin: string
  authorAvatarUrl: string
  prerelease: boolean
  draft: boolean
  category: GitHubReleaseCategory
  categoryLabel: string
  repository: string
}

const GITHUB_STATS_REPO = 'netgoat-xyz/netgoat'
const RELEASE_REPOSITORIES: Record<GitHubReleaseCategory, { repo: string; label: string }> = {
  'main-agent': {
    repo: 'netgoat-xyz/netgoat',
    label: 'Main Agent',
  },
  frontend: {
    repo: 'netgoat-xyz/frontend',
    label: 'Frontend',
  },
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const RELEASES_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

let cachedStats: GitHubStats | null = null
let lastStatsFetch = 0

const cachedReleasesByCategory = new Map<GitHubReleaseCategory, GitHubRelease[]>()
const lastReleasesFetchByCategory = new Map<GitHubReleaseCategory, number>()
const releaseByCategoryAndTagCache = new Map<string, GitHubRelease>()
const releaseDescriptionCache = new Map<string, { value: string; expiresAt: number }>()
const RELEASE_DESCRIPTION_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

type GitHubReleaseResponse = {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string | null
  created_at: string
  prerelease: boolean
  draft: boolean
  author?: {
    login?: string
    avatar_url?: string
  }
}

function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'NetGoat-App',
  }

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

function getReleaseCacheKey(category: GitHubReleaseCategory, tag: string): string {
  return `${category}:${tag}`
}

function normalizeRelease(
  release: GitHubReleaseResponse,
  category: GitHubReleaseCategory
): GitHubRelease {
  const repository = RELEASE_REPOSITORIES[category]

  return {
    id: release.id,
    tagName: release.tag_name,
    name: release.name || release.tag_name,
    body: release.body || '',
    htmlUrl: release.html_url,
    publishedAt: release.published_at || release.created_at,
    createdAt: release.created_at,
    authorLogin: release.author?.login || 'unknown',
    authorAvatarUrl: release.author?.avatar_url || '',
    prerelease: release.prerelease,
    draft: release.draft,
    category,
    categoryLabel: repository.label,
    repository: repository.repo,
  }
}

async function getGitHubReleasesByCategory(
  category: GitHubReleaseCategory,
  limit: number = 20
): Promise<GitHubRelease[]> {
  const cachedReleases = cachedReleasesByCategory.get(category)
  const lastFetch = lastReleasesFetchByCategory.get(category) || 0
  const now = Date.now()

  if (cachedReleases && now - lastFetch < RELEASES_CACHE_DURATION) {
    return cachedReleases.slice(0, limit)
  }

  try {
    const repository = RELEASE_REPOSITORIES[category]

    const response = await fetch(
      `https://api.github.com/repos/${repository.repo}/releases?per_page=${Math.min(limit, 100)}`,
      {
        headers: getGitHubHeaders(),
        next: { revalidate: 1800 },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub releases API error: ${response.status}`)
    }

    const releasesData = (await response.json()) as GitHubReleaseResponse[]
    const releases = releasesData
      .filter((release) => !release.draft)
      .map((release) => normalizeRelease(release, category))

    cachedReleasesByCategory.set(category, releases)
    lastReleasesFetchByCategory.set(category, now)

    for (const release of releases) {
      const cacheKey = getReleaseCacheKey(category, release.tagName)
      releaseByCategoryAndTagCache.set(cacheKey, release)
    }

    return releases.slice(0, limit)
  } catch (error) {
    console.error(`Failed to fetch GitHub releases for ${category}:`, error)

    if (cachedReleases) {
      return cachedReleases.slice(0, limit)
    }

    return []
  }
}

export async function getGitHubReleases(
  limit: number = 20,
  category: GitHubReleaseCategory = 'main-agent'
): Promise<GitHubRelease[]> {
  return getGitHubReleasesByCategory(category, limit)
}

export async function getCategorizedGitHubReleases(
  limitPerCategory: number = 20
): Promise<Record<GitHubReleaseCategory, GitHubRelease[]>> {
  const [mainAgentReleases, frontendReleases] = await Promise.all([
    getGitHubReleasesByCategory('main-agent', limitPerCategory),
    getGitHubReleasesByCategory('frontend', limitPerCategory),
  ])

  return {
    'main-agent': mainAgentReleases,
    frontend: frontendReleases,
  }
}

export async function getGitHubReleaseByTag(
  tag: string,
  category: GitHubReleaseCategory = 'main-agent'
): Promise<GitHubRelease | null> {
  if (!tag) {
    return null
  }

  const cacheKey = getReleaseCacheKey(category, tag)
  const cachedRelease = releaseByCategoryAndTagCache.get(cacheKey)
  if (cachedRelease) {
    return cachedRelease
  }

  try {
    const repository = RELEASE_REPOSITORIES[category]

    const response = await fetch(
      `https://api.github.com/repos/${repository.repo}/releases/tags/${encodeURIComponent(tag)}`,
      {
        headers: getGitHubHeaders(),
        next: { revalidate: 1800 },
      }
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`GitHub release API error: ${response.status}`)
    }

    const releaseData = (await response.json()) as GitHubReleaseResponse
    const release = normalizeRelease(releaseData, category)

    if (!release.draft) {
      releaseByCategoryAndTagCache.set(cacheKey, release)
      return release
    }

    return null
  } catch (error) {
    console.error(`Failed to fetch GitHub release for ${category}/${tag}:`, error)
    return releaseByCategoryAndTagCache.get(cacheKey) || null
  }
}

export async function getGitHubStats(): Promise<GitHubStats> {
  const now = Date.now()
  if (cachedStats && now - lastStatsFetch < CACHE_DURATION) {
    return cachedStats
  }

  try {
    const headers = getGitHubHeaders()

    const repoResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_STATS_REPO}`,
      {
        headers,
        next: { revalidate: 3600 },
      }
    )

    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status}`)
    }

    const repoData = await repoResponse.json()

    const commitsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_STATS_REPO}/commits?per_page=1`,
      {
        headers,
        next: { revalidate: 3600 },
      }
    )

    let commitsCount = 0
    if (commitsResponse.ok) {
      commitsCount = repoData.pushed_at ? 200 : 0
    }

    const contributorsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_STATS_REPO}/contributors?per_page=100`,
      {
        headers,
        next: { revalidate: 3600 },
      }
    )

    let contributorsCount = 0
    if (contributorsResponse.ok) {
      const contributors = await contributorsResponse.json()
      contributorsCount = contributors.length
    }

    const stats: GitHubStats = {
      stars: repoData.stargazers_count || 0,
      commits: commitsCount || 200,
      contributors: contributorsCount || 0,
      lastUpdated: new Date().toISOString(),
    }

    cachedStats = stats
    lastStatsFetch = now

    return stats
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error)

    if (cachedStats) {
      return cachedStats
    }

    return {
      stars: 600,
      commits: 200,
      contributors: 5,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export async function getReleaseDescription(release: GitHubRelease): Promise<string> {
  const cacheKey = `${release.category}:${release.tagName}:${release.publishedAt}`
  const now = Date.now()
  const cached = releaseDescriptionCache.get(cacheKey)
  const bodyHash = getBodyHash(release.body)
  const model = process.env.OPENAI_MODEL || 'llama-3.1-8b-instant'

  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const persistedSummary = await getPersistedReleaseDescription(cacheKey, bodyHash)
  if (persistedSummary) {
    releaseDescriptionCache.set(cacheKey, {
      value: persistedSummary,
      expiresAt: now + RELEASE_DESCRIPTION_CACHE_DURATION,
    })
    return persistedSummary
  }

  const fallback = generateFallbackReleaseDescription(release)

  try {
    const aiSummary = await generateChangelogSummaryWithOpenAI({
      releaseName: release.name,
      tagName: release.tagName,
      categoryLabel: release.categoryLabel,
      body: release.body,
    })

    const summary = aiSummary ? truncate(aiSummary, 260) : fallback

    if (aiSummary) {
      await persistReleaseDescription({
        cacheKey,
        bodyHash,
        summary,
        model,
        source: 'ai',
        release,
      })
    }

    releaseDescriptionCache.set(cacheKey, {
      value: summary,
      expiresAt: now + RELEASE_DESCRIPTION_CACHE_DURATION,
    })

    return summary
  } catch {
    releaseDescriptionCache.set(cacheKey, {
      value: fallback,
      expiresAt: now + RELEASE_DESCRIPTION_CACHE_DURATION,
    })

    return fallback
  }
}

function getBodyHash(body: string): string {
  return crypto
    .createHash('sha256')
    .update(body || '')
    .digest('hex')
}

async function getPersistedReleaseDescription(
  cacheKey: string,
  bodyHash: string
): Promise<string | null> {
  try {
    await dbConnect()
    const record = await ReleaseSummary
      .findOne({ cacheKey, bodyHash, source: 'ai' })
      .lean<{ summary: string }>()

    return record?.summary || null
  } catch {
    return null
  }
}

async function persistReleaseDescription(input: {
  cacheKey: string
  bodyHash: string
  summary: string
  model: string
  source: 'ai' | 'fallback'
  release: GitHubRelease
}): Promise<void> {
  try {
    await dbConnect()
    await ReleaseSummary.findOneAndUpdate(
      { cacheKey: input.cacheKey },
      {
        cacheKey: input.cacheKey,
        category: input.release.category,
        categoryLabel: input.release.categoryLabel,
        repository: input.release.repository,
        tagName: input.release.tagName,
        publishedAt: input.release.publishedAt,
        bodyHash: input.bodyHash,
        summary: input.summary,
        model: input.model,
        source: input.source,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    )
  } catch {
    // Failing to persist should never break changelog rendering.
  }
}

function generateFallbackReleaseDescription(release: GitHubRelease): string {
  const body = release.body || ''

  if (!body.trim()) {
    return 'No release notes were provided for this release.'
  }

  const plainText = toPlainText(body)
  const changes = extractBulletsFromSection(body, [
    'changes',
    "what's new",
    'highlights',
  ])
  const warnings = extractBulletsFromSection(body, [
    'warnings',
    'known issues',
    'important information',
  ])

  const sentences: string[] = []

  if (changes.length > 0) {
    const topChanges = changes.slice(0, 4).join(', ')
    const moreCount = changes.length - 4
    const moreSuffix = moreCount > 0
      ? ` and ${moreCount} more update${moreCount > 1 ? 's' : ''}`
      : ''
    sentences.push(`This release brings ${topChanges}${moreSuffix}.`)
  }

  if (warnings.length > 0) {
    sentences.push(`Important: ${warnings.slice(0, 2).join('; ')}.`)
  }

  if (release.prerelease) {
    sentences.push('This is a pre-release and some features may still be in progress.')
  }

  if (sentences.length === 0) {
    return truncate(plainText, 220)
  }

  return truncate(sentences.join(' '), 260)
}

function toPlainText(content: string): string {
  return content
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractBulletsFromSection(content: string, headings: string[]): string[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const loweredHeadings = headings.map((heading) => heading.toLowerCase())
  const bullets: string[] = []
  let inSection = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/)
    if (headingMatch) {
      const headingText = headingMatch[1].toLowerCase()
      inSection = loweredHeadings.some((heading) => headingText.includes(heading))
      continue
    }

    if (!inSection) {
      continue
    }

    if (line.startsWith('## ') || line.startsWith('### ')) {
      break
    }

    const bulletMatch = line.match(/^[-*+]\s+(.*)$/)
    if (bulletMatch) {
      const normalized = toPlainText(bulletMatch[1])
      if (normalized) {
        bullets.push(normalized)
      }
    }
  }

  return bullets
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}
