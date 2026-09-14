const COOKIE_NAME = 'app_auth'
const PBKDF2_ITERATIONS = 100000
const SESSION_DAYS = 7
const MAX_FAILS = 5
const LOCK_MS = 10 * 60 * 1000

export interface Env {
  gpt_image_playground_auth: D1Database
  ASSETS: Fetcher
  AUTH_SECRET: string
  AI: {
    run: (model: string, inputs: Record<string, unknown>) => Promise<unknown>
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function b64url(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(b64 + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return b64url(sig)
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256)
  return new Uint8Array(bits)
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts[0] !== 'pbkdf2' || parts.length !== 4) return false
  const salt = b64urlDecode(parts[2])
  const expect = b64urlDecode(parts[3])
  const actual = await deriveKey(password, salt)
  if (actual.length !== expect.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expect[i]
  return diff === 0
}

async function createSession(secret: string, userId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400
  const payload = b64url(encoder.encode(JSON.stringify({ uid: userId, exp })))
  const sig = await hmacSign(secret, payload)
  return `${payload}.${sig}`
}

async function readSession(secret: string, cookie: string | null): Promise<string | null> {
  if (!cookie) return null
  const parts = cookie.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expect = await hmacSign(secret, payload)
  if (sig !== expect) return null
  try {
    const data = JSON.parse(decoder.decode(b64urlDecode(payload))) as { uid: string; exp: number }
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data.uid
  } catch {
    return null
  }
}

function getCookieHeader(request: Request): string | null {
  const raw = request.headers.get('Cookie')
  if (!raw) return null
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=').trim()
  }
  return null
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

const LOGIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafafa" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0f" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%232563eb'/%3E%3Cpath d='M6 15l3-3 2.5 2.5L15 10l3 3' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='9' cy='8' r='1.3' fill='white'/%3E%3C/svg%3E" />
<title>登录 · GPT Image Playground</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    color-scheme: light dark;
    --bg: #fafafa;
    --fg: hsl(240 10% 10%);
    --muted-fg: hsl(240 4% 46%);
    --card: #ffffff;
    --border: hsl(240 6% 90%);
    --input-border: hsl(240 6% 90%);
    --input-bg: #ffffff;
    --primary: hsl(221 83% 53%);
    --primary-hover: hsl(221 83% 46%);
    --focus-ring: hsl(221 83% 53% / 0.25);
    --danger: #ef4444;
    --logo-bg: #eff6ff;
    --logo-fg: #2563eb;
    --shadow: 0 10px 40px rgb(0 0 0 / 0.08);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: hsl(240 10% 4%);
      --fg: hsl(0 0% 98%);
      --muted-fg: hsl(240 4% 64%);
      --card: hsl(240 6% 10%);
      --border: hsl(240 4% 22%);
      --input-border: hsl(240 4% 22%);
      --input-bg: hsl(240 8% 13%);
      --primary: hsl(217 91% 60%);
      --primary-hover: hsl(217 91% 66%);
      --focus-ring: hsl(217 91% 60% / 0.3);
      --logo-bg: hsl(217 91% 60% / 0.12);
      --logo-fg: hsl(217 91% 68%);
      --shadow: 0 10px 40px rgb(0 0 0 / 0.45);
    }
  }
  html, body { height: 100%; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--bg);
    color: var(--fg);
    font-family: 'HarmonyOS Sans SC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Noto Kufi Arabic', 'Geeza Pro', 'Tahoma', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .card {
    width: 360px;
    max-width: 100%;
    padding: 28px 24px 26px;
    border-radius: 24px;
    background: var(--card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .logo {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: var(--logo-bg);
    color: var(--logo-fg);
  }
  .logo svg { width: 26px; height: 26px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
  p.sub { font-size: 13px; color: var(--muted-fg); margin: 0 0 22px; line-height: 1.5; }
  label { display: block; font-size: 13px; font-weight: 500; color: var(--muted-fg); margin-bottom: 6px; }
  input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--input-border);
    background: var(--input-bg);
    color: var(--fg);
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  input::placeholder { color: var(--muted-fg); opacity: .7; }
  input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--focus-ring); }
  .field { margin-bottom: 14px; }
  button {
    width: 100%;
    margin-top: 8px;
    padding: 11px 14px;
    border: 0;
    border-radius: 12px;
    background: var(--primary);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background-color .15s, opacity .15s, transform .1s;
  }
  button:hover { background: var(--primary-hover); }
  button:active { transform: scale(.99); }
  button:disabled { opacity: .55; cursor: not-allowed; }
  #err { margin-top: 12px; font-size: 13px; color: var(--danger); min-height: 18px; text-align: center; line-height: 1.4; }
</style>
</head>
<body>
  <form class="card" id="form" novalidate>
    <div class="logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M6 15l3-3 2.5 2.5L15 10l3 3" />
        <circle cx="9" cy="8" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    </div>
    <h1>GPT Image Playground</h1>
    <p class="sub">请登录后继续使用</p>
    <div class="field">
      <label for="username">账号</label>
      <input id="username" name="username" autocomplete="username" autofocus required />
    </div>
    <div class="field">
      <label for="password">密码</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required />
    </div>
    <button id="btn" type="submit">登录</button>
    <div id="err" role="alert" aria-live="polite"></div>
  </form>
  <script>
    (function () {
      var form = document.getElementById('form')
      var btn = document.getElementById('btn')
      var err = document.getElementById('err')
      form.addEventListener('submit', async function (e) {
        e.preventDefault()
        err.textContent = ''
        btn.disabled = true
        try {
          var res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              username: form.username.value,
              password: form.password.value,
            }),
          })
          if (res.ok) {
            window.location.href = '/'
            return
          }
          var data = await res.json().catch(function () { return {} })
          err.textContent = data.error || ('登录失败（HTTP ' + res.status + '）')
        } catch (ex) {
          err.textContent = '网络错误：' + (ex && ex.message ? ex.message : String(ex))
        }
        btn.disabled = false
      })
    })()
  </script>
</body>
</html>`

async function isLocked(db: D1Database, ip: string): Promise<{ locked: boolean; remainingSec?: number }> {
  const row = await db
    .prepare('SELECT fail_count, locked_until FROM auth_attempts WHERE ip = ?')
    .bind(ip)
    .first<{ fail_count: number; locked_until: string }>()
  if (!row) return { locked: false }
  const lockedUntil = Number(row.locked_until) || 0
  if (lockedUntil > Date.now()) return { locked: true, remainingSec: Math.ceil((lockedUntil - Date.now()) / 1000) }
  return { locked: false }
}

async function recordFailure(db: D1Database, ip: string): Promise<void> {
  const now = Date.now()
  const row = await db.prepare('SELECT fail_count FROM auth_attempts WHERE ip = ?').bind(ip).first<{ fail_count: number }>()
  const next = (row?.fail_count ?? 0) + 1
  const lockedUntil = next >= MAX_FAILS ? String(now + LOCK_MS) : ''
  await db
    .prepare(
      `INSERT INTO auth_attempts (ip, fail_count, locked_until, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET fail_count = excluded.fail_count, locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
    )
    .bind(ip, next, lockedUntil, new Date(now).toISOString())
    .run()
}

async function clearFailure(db: D1Database, ip: string): Promise<void> {
  await db.prepare('DELETE FROM auth_attempts WHERE ip = ?').bind(ip).run()
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: { username?: string; password?: string }
  try {
    body = (await request.json()) as { username?: string; password?: string }
  } catch {
    return json({ error: '请求格式错误' }, 400)
  }
  const username = (body.username ?? '').trim()
  const password = body.password ?? ''
  if (!username || !password) return json({ error: '请输入账号和密码' }, 400)

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
  const lock = await isLocked(env.gpt_image_playground_auth, ip)
  if (lock.locked) {
    return json({ error: `失败次数过多，请 ${lock.remainingSec} 秒后再试` }, 429)
  }

  const user = await env.gpt_image_playground_auth
    .prepare('SELECT id, password_hash FROM users WHERE username = ?')
    .bind(username)
    .first<{ id: string; password_hash: string }>()

  const ok = Boolean(user) && (await verifyPassword(password, user!.password_hash))
  if (!ok) {
    await recordFailure(env.gpt_image_playground_auth, ip)
    return json({ error: '账号或密码错误' }, 401)
  }

  await clearFailure(env.gpt_image_playground_auth, ip)
  const token = await createSession(env.AUTH_SECRET, user!.id)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
    },
  })
}

function handleLogout(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  })
}

function normalizeFluxImage(result: unknown): string {
  if (!result || typeof result !== 'object') return ''
  const record = result as Record<string, unknown>
  const direct = record.image
  if (typeof direct === 'string' && direct) return direct
  const nested = record.result
  if (nested && typeof nested === 'object') {
    const image = (nested as Record<string, unknown>).image
    if (typeof image === 'string' && image) return image
  }
  return ''
}

async function handleGenerateImage(request: Request, env: Env): Promise<Response> {
  let body: { prompt?: unknown; steps?: unknown }
  try {
    body = (await request.json()) as { prompt?: unknown; steps?: unknown }
  } catch {
    return json({ error: '请求格式错误' }, 400)
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return json({ error: '请输入提示词' }, 400)

  const rawSteps = Number(body.steps)
  const steps = Number.isFinite(rawSteps) ? Math.min(8, Math.max(1, Math.trunc(rawSteps))) : 4

  try {
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps })
    const image = normalizeFluxImage(result)
    if (!image) return json({ error: '生图未返回图片数据' }, 502)
    return json({ image: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` })
  } catch (err) {
    return json({ error: '生图失败：' + (err instanceof Error ? err.message : String(err)) }, 502)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/auth/login' && request.method === 'POST') {
      return handleLogin(request, env)
    }
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return handleLogout()
    }

    const session = await readSession(env.AUTH_SECRET, getCookieHeader(request))
    if (!session) {
      return new Response(LOGIN_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      })
    }

    if (url.pathname === '/ai/generate' && request.method === 'POST') {
      return handleGenerateImage(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}