/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Offline "demo mode" stand-in for Supabase.
 *
 * Used automatically when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.
 * Everything (products, cart, orders, profiles, login) is stored in the
 * browser's localStorage, so the whole site works without a backend.
 * Each visitor gets their own private copy of the data.
 */
import chocolateCake from '@/assets/product-chocolate-cake.jpg'
import cheesecake from '@/assets/product-cheesecake.jpg'
import macarons from '@/assets/product-macarons.jpg'
import croissant from '@/assets/product-croissant.jpg'
import matchaTiramisu from '@/assets/product-matcha-tiramisu.jpg'
import flan from '@/assets/product-flan.jpg'
import cinnamonRoll from '@/assets/product-cinnamon-roll.jpg'
import brownie from '@/assets/product-brownie.jpg'

type Row = Record<string, any>
type Result = { data: any; error: any; count?: number | null; status?: number }

const PREFIX = 'demo-db:v1:'
const SESSION_KEY = 'demo-db:session'
const FILES_KEY = 'demo-db:files'

/* ---------------- seed data ---------------- */

const now = Date.now()
const iso = (offsetMin: number) => new Date(now - offsetMin * 60_000).toISOString()

const SEED: Record<string, Row[]> = {
  products: [
    { id: 'p1', name: 'Chocolate Lava Cake', description: 'Rich, decadent chocolate cake with a molten caramel center. Handcrafted with Belgian chocolate.', price: 45000, category: 'Cakes', image: chocolateCake, featured: true, allergens: ['gluten', 'dairy', 'eggs'], created_at: iso(1) },
    { id: 'p2', name: 'Strawberry Cheesecake', description: 'Creamy New York style cheesecake topped with fresh strawberries and a sweet glaze.', price: 40000, category: 'Cakes', image: cheesecake, featured: true, allergens: ['gluten', 'dairy', 'eggs'], created_at: iso(2) },
    { id: 'p3', name: 'French Macarons (6pc)', description: 'Assorted French macarons in matcha, caramel, chocolate, and rose flavors.', price: 60000, category: 'Pastries', image: macarons, featured: true, allergens: ['eggs', 'nuts'], created_at: iso(3) },
    { id: 'p4', name: 'Butter Croissant', description: 'Golden, flaky croissant made with premium French butter. Baked fresh every morning.', price: 25000, category: 'Pastries', image: croissant, featured: false, allergens: ['gluten', 'dairy', 'eggs'], created_at: iso(4) },
    { id: 'p5', name: 'Matcha Tiramisu', description: 'Japanese-Italian fusion dessert with layers of matcha cream and espresso-soaked ladyfingers.', price: 50000, category: 'Desserts', image: matchaTiramisu, featured: true, allergens: ['gluten', 'dairy', 'eggs'], created_at: iso(5) },
    { id: 'p6', name: 'Caramel Flan', description: 'Silky smooth custard pudding with rich caramel sauce.', price: 30000, category: 'Desserts', image: flan, featured: false, allergens: ['dairy', 'eggs'], created_at: iso(6) },
    { id: 'p7', name: 'Cinnamon Roll', description: 'Warm, soft cinnamon roll with cream cheese frosting. Perfect for breakfast or a snack.', price: 28000, category: 'Pastries', image: cinnamonRoll, featured: false, allergens: ['gluten', 'dairy', 'eggs'], created_at: iso(7) },
    { id: 'p8', name: 'Fudge Brownie', description: 'Dense, fudgy chocolate brownie topped with walnuts and dusted with powdered sugar.', price: 22000, category: 'Desserts', image: brownie, featured: false, allergens: ['gluten', 'dairy', 'eggs', 'nuts'], created_at: iso(8) },
  ],
  profiles: [],
  cart_items: [],
  orders: [],
  order_items: [],
  prepared_inventory: [],
}

/* ---------------- storage helpers ---------------- */

const safeGet = (k: string) => {
  try { return localStorage.getItem(k) } catch { return null }
}
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v) } catch (e) { console.warn('[demo-db] could not save', k, e) }
}

const memory: Record<string, Row[]> = {}

function load(table: string): Row[] {
  if (memory[table]) return memory[table]
  const raw = safeGet(PREFIX + table)
  let rows: Row[]
  if (raw) {
    try { rows = JSON.parse(raw) } catch { rows = [] }
  } else {
    rows = structuredClone(SEED[table] ?? [])
  }
  memory[table] = rows
  return rows
}

function save(table: string, rows: Row[]) {
  memory[table] = rows
  safeSet(PREFIX + table, JSON.stringify(rows))
  notifyChannels(table)
}

const uid = () =>
  (globalThis.crypto && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

function withDefaults(table: string, row: Row): Row {
  const r: Row = { ...row }
  if (r.id == null && table !== 'prepared_inventory') r.id = uid()
  if (r.created_at == null) r.created_at = new Date().toISOString()
  if (table === 'orders' && r.order_number == null) {
    r.order_number = 'ORD-' + String(load('orders').length + 1001)
  }
  if (table === 'prepared_inventory') r.updated_at = new Date().toISOString()
  return r
}

/* ---------------- relation embedding ---------------- */

const singular = (t: string) => (t.endsWith('ies') ? t.slice(0, -3) + 'y' : t.replace(/s$/, ''))

type Embed = { alias: string; table: string; inner: Embed[] }

/** Parse "a, b, alias:table ( x, nested ( y ) )" → list of embedded relations */
function parseEmbeds(select: string): Embed[] {
  const out: Embed[] = []
  let i = 0
  const s = select
  while (i < s.length) {
    const open = s.indexOf('(', i)
    if (open === -1) break
    // name just before "("
    const before = s.slice(0, open)
    const m = before.match(/([\w]+)\s*(?::\s*([\w]+))?(?:!\w+)?\s*$/)
    // find matching ")"
    let depth = 0, j = open
    for (; j < s.length; j++) {
      if (s[j] === '(') depth++
      else if (s[j] === ')') { depth--; if (depth === 0) break }
    }
    if (m) {
      const alias = m[1]
      const table = m[2] ?? m[1]
      out.push({ alias, table, inner: parseEmbeds(s.slice(open + 1, j)) })
    }
    i = j + 1
  }
  return out
}

function embedRow(parentTable: string, row: Row, embeds: Embed[]): Row {
  if (!embeds.length) return row
  const r = { ...row }
  for (const e of embeds) {
    const target = load(e.table)
    const fk = singular(e.table) + '_id'
    let value: any
    if (row[fk] != null) {
      value = target.find(t => t.id === row[fk]) ?? null
      value = value && embedRow(e.table, value, e.inner)
    } else if (e.table === 'profiles' && row.user_id != null) {
      value = target.find(t => t.id === row.user_id) ?? null
    } else {
      const back = singular(parentTable) + '_id'
      value = target.filter(t => t[back] === row.id).map(t => embedRow(e.table, t, e.inner))
    }
    r[e.alias] = value
  }
  return r
}

/* ---------------- query builder ---------------- */

type Filter = (r: Row) => boolean

const likeToRegex = (p: string, flags = '') =>
  new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', flags)

class Query implements PromiseLike<Result> {
  private filters: Filter[] = []
  private sorts: { col: string; asc: boolean }[] = []
  private lim: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: any = null
  private onConflict: string[] = ['id']
  private selectStr: string | null = null
  private returnRows = false
  private singleMode: 'one' | 'maybe' | null = null

  constructor(private table: string) {}

  select(cols = '*', _opts?: any) {
    this.selectStr = cols
    if (this.mode !== 'select') this.returnRows = true
    return this
  }
  insert(values: Row | Row[]) { this.mode = 'insert'; this.payload = values; return this }
  update(values: Row) { this.mode = 'update'; this.payload = values; return this }
  delete() { this.mode = 'delete'; return this }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.mode = 'upsert'
    this.payload = values
    if (opts?.onConflict) this.onConflict = opts.onConflict.split(',').map(s => s.trim())
    return this
  }

  eq(c: string, v: any) { this.filters.push(r => r[c] === v || String(r[c]) === String(v)); return this }
  neq(c: string, v: any) { this.filters.push(r => r[c] !== v); return this }
  gt(c: string, v: any) { this.filters.push(r => r[c] > v); return this }
  gte(c: string, v: any) { this.filters.push(r => r[c] >= v); return this }
  lt(c: string, v: any) { this.filters.push(r => r[c] < v); return this }
  lte(c: string, v: any) { this.filters.push(r => r[c] <= v); return this }
  in(c: string, vs: any[]) { this.filters.push(r => vs.includes(r[c])); return this }
  is(c: string, v: any) { this.filters.push(r => (r[c] ?? null) === v); return this }
  like(c: string, p: string) { const re = likeToRegex(p); this.filters.push(r => re.test(String(r[c] ?? ''))); return this }
  ilike(c: string, p: string) { const re = likeToRegex(p, 'i'); this.filters.push(r => re.test(String(r[c] ?? ''))); return this }
  match(obj: Row) { Object.entries(obj).forEach(([k, v]) => this.eq(k, v)); return this }
  not(c: string, op: string, v: any) {
    this.filters.push(r => (op === 'is' ? (r[c] ?? null) !== v : op === 'in' ? !String(v).includes(String(r[c])) : r[c] !== v))
    return this
  }
  filter(c: string, op: string, v: any) {
    const fn = (this as any)[op]
    if (typeof fn === 'function') fn.call(this, c, v)
    return this
  }
  or(_expr: string) { return this } // not needed by this app
  contains() { return this }
  order(col: string, opts?: { ascending?: boolean }) { this.sorts.push({ col, asc: opts?.ascending ?? true }); return this }
  limit(n: number) { this.lim = n; return this }
  range(from: number, to: number) { this.rangeFrom = from; this.rangeTo = to; return this }
  abortSignal() { return this }
  returns<T>() { return this as unknown as Query & PromiseLike<{ data: T; error: any }> }
  single<T = any>() { this.singleMode = 'one'; return this as unknown as Query & PromiseLike<{ data: T; error: any }> }
  maybeSingle<T = any>() { this.singleMode = 'maybe'; return this as unknown as Query & PromiseLike<{ data: T | null; error: any }> }

  private run(): Result {
    let rows = load(this.table)
    const matches = (r: Row) => this.filters.every(f => f(r))
    let affected: Row[] = []

    if (this.mode === 'insert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => withDefaults(this.table, r))
      rows = [...rows, ...list]
      save(this.table, rows)
      affected = list
    } else if (this.mode === 'upsert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload]
      rows = [...rows]
      for (const item of list) {
        const idx = rows.findIndex(r => this.onConflict.every(k => r[k] === item[k]))
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item }
          affected.push(rows[idx])
        } else {
          const n = withDefaults(this.table, item)
          rows.push(n)
          affected.push(n)
        }
      }
      save(this.table, rows)
    } else if (this.mode === 'update') {
      rows = rows.map(r => {
        if (!matches(r)) return r
        const n = { ...r, ...this.payload }
        affected.push(n)
        return n
      })
      save(this.table, rows)
    } else if (this.mode === 'delete') {
      affected = rows.filter(matches)
      save(this.table, rows.filter(r => !matches(r)))
    } else {
      affected = rows.filter(matches)
    }

    if (this.mode !== 'select' && !this.returnRows) {
      return { data: null, error: null, status: 200 }
    }

    let out = [...affected]
    for (const s of [...this.sorts].reverse()) {
      out.sort((a, b) => {
        const x = a[s.col], y = b[s.col]
        if (x === y) return 0
        if (x == null) return 1
        if (y == null) return -1
        return (x > y ? 1 : -1) * (s.asc ? 1 : -1)
      })
    }
    if (this.rangeFrom != null) out = out.slice(this.rangeFrom, (this.rangeTo ?? out.length) + 1)
    if (this.lim != null) out = out.slice(0, this.lim)

    const embeds = this.selectStr ? parseEmbeds(this.selectStr) : []
    out = out.map(r => embedRow(this.table, structuredClone(r), embeds))

    if (this.singleMode) {
      if (out.length === 0) {
        return this.singleMode === 'maybe'
          ? { data: null, error: null, status: 200 }
          : { data: null, error: { message: 'No rows found', code: 'PGRST116' }, status: 406 }
      }
      return { data: out[0], error: null, status: 200 }
    }
    return { data: out, error: null, count: out.length, status: 200 }
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: any) => B | PromiseLike<B>) | null) {
    let res: Result
    try { res = this.run() } catch (e: any) { res = { data: null, error: { message: e?.message ?? String(e) } } }
    return Promise.resolve(res).then(ok, fail)
  }
}

/* ---------------- realtime channels (local only) ---------------- */

type Chan = { table?: string; cb: (p: any) => void }
const channels = new Set<{ handlers: Chan[] }>()

function notifyChannels(table: string) {
  channels.forEach(ch =>
    ch.handlers.forEach(h => {
      if (!h.table || h.table === table) setTimeout(() => h.cb({ table, eventType: '*' }), 0)
    })
  )
}

function channel(_name: string) {
  const ch: any = { handlers: [] as Chan[] }
  ch.on = (_type: string, filter: any, cb: (p: any) => void) => { ch.handlers.push({ table: filter?.table, cb }); return ch }
  ch.subscribe = (cb?: (s: string) => void) => { channels.add(ch); cb?.('SUBSCRIBED'); return ch }
  ch.unsubscribe = async () => { channels.delete(ch); return 'ok' }
  return ch
}

/* ---------------- rpc ---------------- */

function rpc(name: string, args: Row = {}): Promise<Result> {
  const inv = load('prepared_inventory')
  if (name === 'add_prepared_qty') {
    const idx = inv.findIndex(r => r.product_id === args.p_product_id)
    const next = [...inv]
    if (idx >= 0) next[idx] = { ...next[idx], qty: (next[idx].qty ?? 0) + Number(args.p_qty ?? 0), updated_at: new Date().toISOString() }
    else next.push({ product_id: args.p_product_id, qty: Number(args.p_qty ?? 0), updated_at: new Date().toISOString() })
    save('prepared_inventory', next)
  } else if (name === 'clear_prepared_inventory') {
    save('prepared_inventory', [])
  } else if (name === 'consume_prepared_for_order') {
    const items = load('order_items').filter(i => i.order_id === args.p_order_id)
    const next = inv.map(r => {
      const used = items.filter(i => i.product_id === r.product_id).reduce((s, i) => s + (i.quantity ?? 0), 0)
      return used ? { ...r, qty: Math.max(0, (r.qty ?? 0) - used), updated_at: new Date().toISOString() } : r
    })
    save('prepared_inventory', next)
  }
  return Promise.resolve({ data: null, error: null })
}

/* ---------------- auth ---------------- */

type Listener = (event: string, session: any) => void
const listeners = new Set<Listener>()

function readSession() {
  const raw = safeGet(SESSION_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function ensureProfile(user: Row, role: 'user' | 'staff' | 'admin') {
  const profiles = load('profiles')
  if (!profiles.some(p => p.id === user.id)) {
    save('profiles', [
      ...profiles,
      { id: user.id, role, full_name: user.user_metadata?.full_name ?? null, phone: null, address: null, created_at: new Date().toISOString() },
    ])
  }
}

function startSession(email: string) {
  const role: 'user' | 'staff' | 'admin' =
    /staff/i.test(email) ? 'staff' : /user|customer/i.test(email) ? 'user' : 'admin'
  const id = 'demo-' + email.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const user = {
    id,
    email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: email.split('@')[0] },
    created_at: new Date().toISOString(),
  }
  ensureProfile(user, role)
  const session = { access_token: 'demo', token_type: 'bearer', expires_in: 3600 * 24 * 365, refresh_token: 'demo', user }
  safeSet(SESSION_KEY, JSON.stringify(session))
  listeners.forEach(l => setTimeout(() => l('SIGNED_IN', session), 0))
  return session
}

/** Convert a redirect URL written for the domain root into one under the app's base path */
function toAppUrl(redirectTo?: string) {
  const base = import.meta.env.BASE_URL || '/'
  let path = '/dashboard'
  if (redirectTo) {
    try {
      const u = new URL(redirectTo, window.location.origin)
      path = u.pathname + u.search + u.hash
    } catch { /* keep default */ }
  }
  if (base !== '/' && path.startsWith(base)) return path
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
}

const auth = {
  async getSession() { return { data: { session: readSession() }, error: null } },
  async getUser() { return { data: { user: readSession()?.user ?? null }, error: null } },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb)
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }
  },
  async signInWithPassword({ email }: { email: string; password: string }) {
    const session = startSession(email || 'admin@demo.local')
    return { data: { session, user: session.user }, error: null }
  },
  async signInWithOAuth(opts?: { provider?: string; options?: { redirectTo?: string } }) {
    startSession('admin@demo.local')
    window.location.assign(toAppUrl(opts?.options?.redirectTo))
    return { data: { provider: opts?.provider ?? 'demo', url: null }, error: null }
  },
  async signOut() {
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    listeners.forEach(l => setTimeout(() => l('SIGNED_OUT', null), 0))
    return { error: null }
  },
  async updateUser(attrs: Row) {
    const s = readSession()
    if (s) { s.user = { ...s.user, ...attrs }; safeSet(SESSION_KEY, JSON.stringify(s)) }
    return { data: { user: s?.user ?? null }, error: null }
  },
}

/* ---------------- storage ---------------- */

const fileUrls: Record<string, string> = (() => {
  try { return JSON.parse(safeGet(FILES_KEY) ?? '{}') } catch { return {} }
})()

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(file)
  })

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: Blob, _opts?: any) {
        const key = bucket + '/' + path
        try {
          fileUrls[key] = await readAsDataUrl(file)
        } catch {
          fileUrls[key] = URL.createObjectURL(file)
        }
        safeSet(FILES_KEY, JSON.stringify(fileUrls))
        return { data: { path }, error: null }
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: fileUrls[bucket + '/' + path] ?? '' } }
      },
      async remove(paths: string[]) {
        paths.forEach(p => delete fileUrls[bucket + '/' + p])
        safeSet(FILES_KEY, JSON.stringify(fileUrls))
        return { data: null, error: null }
      },
    }
  },
}

/* ---------------- client ---------------- */

export function createMockClient() {
  console.info('[demo-db] Supabase not configured — running in offline demo mode (data saved in this browser).')
  return {
    from: (table: string) => new Query(table),
    rpc,
    channel,
    removeChannel: async (ch: any) => { channels.delete(ch); return 'ok' },
    removeAllChannels: async () => { channels.clear(); return [] },
    auth,
    storage,
  }
}
