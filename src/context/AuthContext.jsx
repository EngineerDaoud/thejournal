import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// ---- security settings ------------------------------------------------------
const IDLE_LIMIT_MS = 30 * 60 * 1000 // admin is signed out after 30 minutes without activity
const GUARD_KEY = 'admin-login-guard' // failed-attempt counter (slows down password guessing)
const ACTIVE_KEY = 'admin-last-active' // so a long-closed tab cannot resume an old session
const MAX_FAILS = 5
const GENERIC_ERROR = 'Could not sign in. Check your email and password.'

function readGuard() {
  try {
    return JSON.parse(localStorage.getItem(GUARD_KEY)) || { fails: 0, until: 0 }
  } catch {
    return { fails: 0, until: 0 }
  }
}
function writeGuard(g) {
  try {
    localStorage.setItem(GUARD_KEY, JSON.stringify(g))
  } catch {
    /* ignore */
  }
}

// The only thing that decides "is this person the admin" is the DATABASE.
// (is_admin() runs on the server and checks the signed-in user's ID against the
// private admins table.) Nothing in the browser can fake this.
async function checkAdminOnServer() {
  const { data: userData, error: userError } = await supabase.auth.getUser() // asks the server if the session is real
  if (userError || !userData?.user) return false
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionRead, setSessionRead] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. read whatever session the browser has + keep it in sync
  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setSessionRead(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // 2. every time the session changes, the server decides if it is the admin
  useEffect(() => {
    if (!sessionRead) return
    let alive = true

    if (!session) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    // A session left over from a long time ago is thrown away.
    try {
      const last = Number(localStorage.getItem(ACTIVE_KEY) || 0)
      if (last && Date.now() - last > IDLE_LIMIT_MS) {
        localStorage.removeItem(ACTIVE_KEY)
        supabase.auth.signOut({ scope: 'local' })
        setIsAdmin(false)
        setLoading(false)
        return
      }
    } catch {
      /* ignore */
    }

    checkAdminOnServer().then((ok) => {
      if (!alive) return
      setIsAdmin(ok)
      setLoading(false)
      // Signed in as somebody who is NOT the admin: remove that session at once.
      if (!ok) supabase.auth.signOut({ scope: 'local' })
    })

    return () => {
      alive = false
    }
  }, [session, sessionRead])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' }) // ends the session on every device
    } catch {
      /* ignore */
    }
    try {
      await supabase.auth.signOut({ scope: 'local' })
      localStorage.removeItem(ACTIVE_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
    setIsAdmin(false)
  }, [])

  // 3. automatic sign-out after 30 idle minutes
  useEffect(() => {
    if (!isAdmin) return
    let last = Date.now()
    let lastSaved = 0
    function bump() {
      last = Date.now()
      if (last - lastSaved > 15000) {
        lastSaved = last
        try {
          localStorage.setItem(ACTIVE_KEY, String(last))
        } catch {
          /* ignore */
        }
      }
    }
    function check() {
      if (Date.now() - last > IDLE_LIMIT_MS) signOut()
    }
    bump()
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }))
    document.addEventListener('visibilitychange', check)
    const timer = setInterval(check, 30000)
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump))
      document.removeEventListener('visibilitychange', check)
      clearInterval(timer)
    }
  }, [isAdmin, signOut])

  // Returns null on success, or { message } on failure. The message never says
  // whether the email or the password was wrong, or whether the account exists.
  async function signIn(email, password) {
    const guard = readGuard()
    const now = Date.now()
    if (guard.until > now) {
      const secs = Math.ceil((guard.until - now) / 1000)
      return { message: `Too many attempts. Please wait ${secs} seconds and try again.` }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || ''),
    })

    let ok = !error
    if (ok) {
      ok = await checkAdminOnServer()
      if (!ok) await supabase.auth.signOut({ scope: 'local' }) // right password, but not the admin
    }

    if (!ok) {
      const fails = guard.fails + 1
      const until =
        fails >= MAX_FAILS ? now + Math.min(15 * 60_000, 30_000 * 2 ** (fails - MAX_FAILS)) : 0
      writeGuard({ fails, until })
      await new Promise((r) => setTimeout(r, 700)) // small delay makes guessing slower
      return { message: GENERIC_ERROR }
    }

    writeGuard({ fails: 0, until: 0 })
    try {
      localStorage.setItem(ACTIVE_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setIsAdmin(true)
    return null
  }

  // Each signed-in admin's own picture, kept on their own Supabase Auth account
  // (user_metadata) — not one shared setting, so every admin sets their own.
  const avatarUrl = session?.user?.user_metadata?.avatar_url || null

  // dataUrl: a small base64 image (e.g. from a resized <canvas>), or null to remove it.
  async function setAvatar(dataUrl) {
    const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: dataUrl } })
    if (!error && data?.user) setSession((s) => (s ? { ...s, user: data.user } : s))
    return error
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading, avatarUrl, signIn, signOut, setAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}