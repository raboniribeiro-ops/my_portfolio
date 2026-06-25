import { Client } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Project, GridSize } from './types'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DB_ID = process.env.NOTION_DATABASE_ID!

// ── Types ──────────────────────────────────────────────────

export interface ExperienceItem {
  id: string
  name: string
  period: string
  color: string
  logo: string | null
}

export interface AwardGroup {
  group: string
  items: string[]
}

export interface ProjectItem {
  id: string
  name: string
  type: string
  color: string
  logo: string | null
  link: string | null
}

export interface ClientItem {
  id: string
  name: string
  link: string | null
}

export interface BioData {
  bioText: string[]
  capabilities: string[]
  avatarUrl: string | null
  openToWork: boolean
  experience: ExperienceItem[]
  awards: AwardGroup[]
  relevantProjects: ProjectItem[]
  clients: ClientItem[]
}

// ── Helpers ────────────────────────────────────────────────

function notionImageProxy(url: string): string {
  return `/api/notion-image?url=${encodeURIComponent(url)}`
}

type AnyProp = Record<string, unknown>

function str(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function getFileUrl(file: AnyProp): string | null {
  try {
    if (file.type === 'file') return str((file.file as AnyProp)?.url) || null
    if (file.type === 'external') return str((file.external as AnyProp)?.url) || null
  } catch { /* ignore */ }
  return null
}

function safeJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function firstFileProxy(files: AnyProp[]): string | null {
  if (!files?.length) return null
  const url = getFileUrl(files[0])
  return url ? notionImageProxy(url) : null
}

// ── Portfolio Projects ─────────────────────────────────────

function parseProject(page: PageObjectResponse): Project | null {
  try {
    const props = page.properties as Record<string, AnyProp>
    const getProp = (key: string): AnyProp | null => props[key] ?? null

    const title = (() => {
      const p = getProp('Name') ?? getProp('title')
      if (!p || p.type !== 'title') return ''
      return str((p.title as Array<{ plain_text: string }>)[0]?.plain_text)
    })()

    const getRichText = (key: string): string => {
      const p = getProp(key)
      if (!p || p.type !== 'rich_text') return ''
      return (p.rich_text as Array<{ plain_text: string }>).map(t => t.plain_text).join('')
    }

    const getNumber = (key: string): number => {
      const p = getProp(key)
      if (!p || p.type !== 'number') return 0
      return typeof p.number === 'number' ? p.number : 0
    }

    const getSelect = (key: string): string => {
      const p = getProp(key)
      if (!p || p.type !== 'select') return ''
      return str((p.select as AnyProp)?.name)
    }

    const getCheckbox = (key: string): boolean => {
      const p = getProp(key)
      if (!p || p.type !== 'checkbox') return false
      return p.checkbox === true
    }

    const getFiles = (key: string): string[] => {
      const p = getProp(key)
      if (!p || p.type !== 'files') return []
      return (p.files as AnyProp[])
        .map(getFileUrl)
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
        .map(notionImageProxy)
    }

    const cover = getFiles('Cover')[0] ?? null
    const media = getFiles('Media')
    const videoUrlsRaw = getRichText('Video_Urls')
    const videoUrls = videoUrlsRaw ? videoUrlsRaw.split(',').map(u => u.trim()).filter(Boolean) : []
    const rawGridSize = getSelect('Grid_Size').toLowerCase()
    const gridSize: GridSize = ['small', 'medium', 'large'].includes(rawGridSize)
      ? (rawGridSize as GridSize) : 'medium'

    return {
      id: page.id, title,
      client: getRichText('Client'),
      year: getNumber('Year'),
      category: getSelect('Category'),
      slug: getRichText('Slug'),
      cover, media, videoUrls, gridSize,
      order: getNumber('Order'),
      published: getCheckbox('Published'),
      description: getRichText('Description'),
    }
  } catch (err) {
    console.error('[notion] parseProject error on page', page.id, err)
    return null
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await notion.databases.query({ database_id: DB_ID })
    return (response.results as PageObjectResponse[])
      .map(parseProject)
      .filter((p): p is Project => p !== null && p.published)
      .sort((a, b) => a.order - b.order)
  } catch (err) {
    console.error('[notion] getProjects error:', err)
    return []
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const response = await notion.databases.query({ database_id: DB_ID })
    return (response.results as PageObjectResponse[])
      .map(parseProject)
      .find((p): p is Project => p !== null && p.slug === slug) ?? null
  } catch (err) {
    console.error('[notion] getProjectBySlug error:', err)
    return null
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const response = await notion.databases.query({ database_id: DB_ID })
    return (response.results as PageObjectResponse[])
      .map(parseProject)
      .filter((p): p is Project => p !== null && p.published && p.slug.length > 0)
      .map(p => p.slug)
  } catch (err) {
    console.error('[notion] getAllSlugs error:', err)
    return []
  }
}

// ── Bio ────────────────────────────────────────────────────

type DbQuery = Parameters<typeof notion.databases.query>[0]

async function queryDbSafe(dbId: string | undefined, opts?: { sorts?: DbQuery['sorts'] }) {
  if (!dbId) return []
  try {
    const res = await notion.databases.query({
      database_id: dbId,
      ...(opts?.sorts ? { sorts: opts.sorts } : {}),
    })
    return res.results as PageObjectResponse[]
  } catch {
    return []
  }
}

export async function getBio(): Promise<BioData | null> {
  try {
    const bioId  = process.env.NOTION_BIO_PAGE_ID
    if (!bioId) return null

    const orderSort = [{ property: 'order', direction: 'ascending' as const }]

    const [bioResults, expResults, projResults, clientResults] = await Promise.all([
      queryDbSafe(bioId, {}),
      queryDbSafe(process.env.NOTION_EXPERIENCE_DB_ID, { sorts: orderSort }),
      queryDbSafe(process.env.NOTION_RELEVANT_PROJECTS_DB_ID, { sorts: orderSort }),
      queryDbSafe(process.env.NOTION_CLIENTS_DB_ID, { sorts: orderSort }),
    ])

    // ── Bio base
    const bioPage = bioResults[0]
    const props = bioPage ? bioPage.properties as Record<string, AnyProp> : {}

    const getAnyText = (key: string): string => {
      const p = props[key]
      if (!p) return ''
      if (p.type === 'rich_text') return (p.rich_text as Array<{ plain_text: string }>).map(t => t.plain_text).join('')
      if (p.type === 'title') return (p.title as Array<{ plain_text: string }>).map(t => t.plain_text).join('')
      return ''
    }
    const getMultiSelect = (key: string): string[] => {
      const p = props[key]
      if (!p || p.type !== 'multi_select') return []
      return (p.multi_select as Array<{ name: string }>).map(s => s.name)
    }

    const avatarUrl = (() => {
      const p = props.avatar
      if (!p || p.type !== 'files') return null
      return firstFileProxy(p.files as AnyProp[])
    })()

    const openToWork = (() => {
      const p = props.open_to_work
      return !!p && p.type === 'checkbox' && p.checkbox === true
    })()

    const bioText = getAnyText('bio_text').split('\n').filter(Boolean)
    const capabilities = getMultiSelect('capabilities')
    const awards = safeJSON<AwardGroup[]>(getAnyText('awards'), [])

    // ── Experience DB
    const experience: ExperienceItem[] = expResults.map(page => {
      const p = page.properties as Record<string, AnyProp>
      const nameArr = (p.name ?? p.Name) as AnyProp
      return {
        id: page.id,
        name: str((nameArr?.title as Array<{ plain_text: string }>)?.[0]?.plain_text),
        period: str((p.period?.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text),
        color: str((p.color?.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || '#1a1a1a',
        logo: firstFileProxy(p.logo?.files as AnyProp[] ?? []),
      }
    })

    // ── Relevant Projects DB
    const relevantProjects: ProjectItem[] = projResults.map(page => {
      const p = page.properties as Record<string, AnyProp>
      const nameArr = (p.name ?? p.Name) as AnyProp
      return {
        id: page.id,
        name: str((nameArr?.title as Array<{ plain_text: string }>)?.[0]?.plain_text),
        type: str((p.type?.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text),
        color: str((p.color?.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || '#1a1a1a',
        logo: firstFileProxy(p.logo?.files as AnyProp[] ?? []),
        link: str((p.link as AnyProp)?.url) || null,
      }
    })

    // ── Clients DB
    const clients: ClientItem[] = clientResults.map(page => {
      const p = page.properties as Record<string, AnyProp>
      const nameArr = (p.name ?? p.Name) as AnyProp
      return {
        id: page.id,
        name: str((nameArr?.title as Array<{ plain_text: string }>)?.[0]?.plain_text),
        link: str((p.link as AnyProp)?.url) || null,
      }
    })

    return { bioText, capabilities, avatarUrl, openToWork, experience, awards, relevantProjects, clients }
  } catch (err) {
    console.error('[notion] getBio error:', err)
    return null
  }
}
