import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DOMAINS = [
  'prod-files-secure.s3.us-east-1.amazonaws.com',
  's3.us-west-2.amazonaws.com',
  'www.notion.so',
  'notion.so',
]

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const allowed = ALLOWED_DOMAINS.some(
    domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
  )

  if (!allowed) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 })
  }

  try {
    const res = await fetch(rawUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const body = await res.arrayBuffer()

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[notion-image] fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }
}
