// Vercel serverless function: real-time visitors of ONE article, taken from Google Analytics 4.
// Called by the article page as  /api/live?title=<article title>
// Returns { ok: true, count: <people on this article in the last 30 minutes> }.
//
// Needs 3 environment variables in Vercel (Project -> Settings -> Environment Variables):
//   GA_PROPERTY_ID    the numeric GA4 property id (GA -> Admin -> Property details)
//   GA_CLIENT_EMAIL   client_email from the Google service account JSON key
//   GA_PRIVATE_KEY    private_key from the same JSON key (paste it as it is, with the \n characters)
// The service account email must also be added as a Viewer in GA -> Admin -> Property access management.

import crypto from 'node:crypto'

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

let token = null // { value, expires }
const results = new Map() // title -> { count, at }  (short cache so Google's quota is never hit)
const CACHE_MS = 20 * 1000

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

async function getAccessToken() {
  if (token && token.expires > Date.now() + 60 * 1000) return token.value

  const email = process.env.GA_CLIENT_EMAIL
  const key = String(process.env.GA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(key)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  })
  if (!r.ok) throw new Error(`token ${r.status}`)
  const data = await r.json()
  token = { value: data.access_token, expires: Date.now() + (data.expires_in || 3600) * 1000 }
  return token.value
}

async function countForTitle(title) {
  const accessToken = await getAccessToken()
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA_PROPERTY_ID}:runRealtimeReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'unifiedScreenName',
            stringFilter: { matchType: 'CONTAINS', value: title, caseSensitive: false },
          },
        },
        limit: 50,
      }),
    },
  )
  if (!r.ok) throw new Error(`report ${r.status}`)
  const data = await r.json()
  // One row per page title that contains the article title; add them up.
  return (data.rows || []).reduce((sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0)
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store')

    if (!process.env.GA_PROPERTY_ID || !process.env.GA_CLIENT_EMAIL || !process.env.GA_PRIVATE_KEY) {
      return res.status(200).json({ ok: false, reason: 'not-configured' })
    }

    const title = String(req.query?.title || '').trim().slice(0, 200)
    if (!title) return res.status(400).json({ ok: false })

    const hit = results.get(title)
    if (hit && Date.now() - hit.at < CACHE_MS) {
      return res.status(200).json({ ok: true, count: hit.count })
    }

    const count = await countForTitle(title)
    if (results.size > 200) results.clear()
    results.set(title, { count, at: Date.now() })
    return res.status(200).json({ ok: true, count })
  } catch (e) {
    // Never crash: the badge simply stays hidden. "detail" says what failed (no secrets in it).
    console.error('api/live failed:', e && e.message ? e.message : e)
    return res
      .status(200)
      .json({ ok: false, reason: 'ga-error', detail: String((e && e.message) || e).slice(0, 200) })
  }
}