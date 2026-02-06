// src/pages/Staff.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Order, Product, PaymentMethod } from '@/data/types'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'


/* =====================
   Supabase Row Types
===================== */
type ProfileRow = {
  full_name: string | null
  phone: string | null
}

type OrderItemRow = {
  id: string
  quantity: number
  product: Product | null
}

type OrderRow = {
  id: string
  order_number: string
  user_id: string
  status: Order['status']
  total: number
  payment_method: PaymentMethod
  paid: boolean
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  notes: string | null
  created_at: string
  profiles: ProfileRow | null
  order_items: OrderItemRow[]
}

type PreparedInventoryRow = {
  product_id: string
  qty: number
  updated_at: string
}

/* =====================
   Helpers
===================== */
function clampNonNegative(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

function mapOrderRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,

    customerName: row.profiles?.full_name ?? undefined,
    customerPhone: row.profiles?.phone ?? undefined,

    status: row.status,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paid: Boolean(row.paid),

    deliveryMethod: row.delivery_method,
    deliveryAddress: row.delivery_address ?? undefined,

    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),

    items: (row.order_items ?? [])
      .filter(i => i.product !== null)
      .map(i => ({
        orderItemId: i.id,
        product: i.product as Product,
        quantity: i.quantity,

        // UI-only
        preparedQuantity: 0,
        missingStock: false,
      })),
  }
}

/* =====================
   UI Helpers
===================== */
const statusBtnClass = (active: boolean) =>
  [
    'px-3 py-1 rounded-md text-sm font-medium transition border',
    active
      ? 'bg-black text-white border-black shadow'
      : 'bg-white text-black border-gray-300 hover:bg-gray-100',
  ].join(' ')

/* =====================
   Local FIFO Allocation Types
===================== */
type PrepEntry = {
  productId: string
  qty: number
}

type AllocationMap = Record<
  string, // orderId
  Record<
    string, // productId
    number // allocated qty for this order+product
  >
>

/**
 * FIFO allocate prepared quantities across orders.
 * Returns allocation map: orderId -> productId -> qty allocated.
 */
function allocateFIFO(orders: Order[], prepared: PrepEntry[]): AllocationMap {
  const remaining: Record<string, number> = {}
  for (const p of prepared) remaining[p.productId] = (remaining[p.productId] ?? 0) + p.qty

  // FIFO: earliest first
  const fifoOrders = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const allocation: AllocationMap = {}

  for (const order of fifoOrders) {
    if (order.status === 'completed') continue

    for (const item of order.items) {
      const pid = item.product.id
      const available = remaining[pid] ?? 0
      if (available <= 0) continue

      const need = item.quantity
      if (need <= 0) continue

      const give = Math.min(need, available)
      if (give <= 0) continue

      if (!allocation[order.id]) allocation[order.id] = {}
      allocation[order.id][pid] = (allocation[order.id][pid] ?? 0) + give

      remaining[pid] = available - give
    }
  }

  return allocation
}

function orderSatisfiedByAllocation(order: Order, allocation: AllocationMap): boolean {
  const alloc = allocation[order.id] ?? {}

  return order.items.every(item => {
    const pid = item.product.id
    const got = alloc[pid] ?? 0
    return got >= item.quantity
  })
}

export default function Staff() {
  const { user, profile, loading: authLoading } = useAuth()

  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  // UI-only highlight state (instant button highlight)
  const [orderStatusUI, setOrderStatusUI] = useState<Record<string, Order['status']>>({})

  // products for top selector
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [batchQty, setBatchQty] = useState<number>(0)

  // Prepared pool (FROM DB)
  const [preparedList, setPreparedList] = useState<PrepEntry[]>([])
  const [allocation, setAllocation] = useState<AllocationMap>({})

  // ✅ NEW: filter
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'pickup' | 'delivery'>('all')

  const navigate = useNavigate()

  const isStaffOrAdmin = useMemo(() => {
    return profile?.role === 'admin' || profile?.role === 'staff'
  }, [profile?.role])

  const preparedChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  /* =====================
     Fetch Products
  ===================== */
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
    if (error) {
      console.error('[Staff] fetchProducts error:', error)
      return
    }
    setProducts((data as Product[]) ?? [])
  }, [])

  /* =====================
     Fetch Orders
  ===================== */
  const fetchOrders = useCallback(async () => {
    const userId = user?.id
    const profileId = profile?.id

    if (!userId || !profileId) {
      setOrders([])
      setOrdersLoading(false)
      setOrdersError(null)
      return
    }

    setOrdersLoading(true)
    setOrdersError(null)

    const timeout = window.setTimeout(() => {
      console.warn('[Staff] fetchOrders timeout (10s)')
      setOrdersLoading(false)
      setOrdersError('Request timed out. Check Supabase policies / network.')
    }, 10000)

    try {
      let query = supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          user_id,
          status,
          total,
          payment_method,
          paid,
          delivery_method,
          delivery_address,
          notes,
          created_at,
          profiles:profiles (
            full_name,
            phone
          ),
          order_items (
            id,
            quantity,
            product:products ( * )
          )
        `
        )
        .order('created_at', { ascending: true })

      if (!isStaffOrAdmin) {
        query = query.eq('user_id', userId)
      }

      // ✅ filter in DB query (more efficient)
      if (deliveryFilter !== 'all') {
        query = query.eq('delivery_method', deliveryFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('[Staff] fetchOrders error:', error)
        setOrders([])
        setOrdersError(error.message ?? 'Failed to load orders')
        return
      }

      const mapped = (data as unknown as OrderRow[]).map(mapOrderRowToOrder)
      setOrders(mapped)
    } catch (e: unknown) {
      console.error('[Staff] fetchOrders exception:', e)
      setOrders([])
      setOrdersError(getErrorMessage(e))
    } finally {
      window.clearTimeout(timeout)
      setOrdersLoading(false)
    }
  }, [user?.id, profile?.id, isStaffOrAdmin, deliveryFilter])

  /* =====================
     Prepared Pool (DB)
  ===================== */
  const fetchPreparedInventory = useCallback(async () => {
    if (!user || !profile) return
    if (!(profile.role === 'admin' || profile.role === 'staff')) return

    const { data, error } = await supabase
      .from('prepared_inventory')
      .select('product_id, qty, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Staff] fetchPreparedInventory error:', error)
      return
    }

    const list: PrepEntry[] = ((data as PreparedInventoryRow[]) ?? [])
      .filter(r => (r.qty ?? 0) > 0)
      .map(r => ({ productId: r.product_id, qty: Number(r.qty ?? 0) }))

    setPreparedList(list)
  }, [user, profile])

  const setupPreparedRealtime = useCallback(() => {
    if (!user || !profile) return
    if (!(profile.role === 'admin' || profile.role === 'staff')) return

    if (preparedChannelRef.current) {
      supabase.removeChannel(preparedChannelRef.current)
      preparedChannelRef.current = null
    }

    const ch = supabase
      .channel('prepared_inventory_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prepared_inventory' },
        () => {
          void fetchPreparedInventory()
        }
      )
      .subscribe()

    preparedChannelRef.current = ch
  }, [user, profile, fetchPreparedInventory])

  useEffect(() => {
    if (authLoading) return
    void fetchOrders()
    void fetchProducts()
    void fetchPreparedInventory()
    setupPreparedRealtime()

    return () => {
      if (preparedChannelRef.current) {
        supabase.removeChannel(preparedChannelRef.current)
        preparedChannelRef.current = null
      }
    }
  }, [authLoading, fetchOrders, fetchProducts, fetchPreparedInventory, setupPreparedRealtime])

  /* =====================
     Update Order Status
  ===================== */
  const updateOrderStatus = useCallback(
    async (orderId: string, status: Order['status']) => {
      // optimistic update
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
      setOrderStatusUI(prev => ({ ...prev, [orderId]: status }))

      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)

      if (error) {
        console.error('[Staff] updateOrderStatus failed:', error)
        await fetchOrders()
        return
      }

      // remove override after success
      setOrderStatusUI(prev => {
        const copy = { ...prev }
        delete copy[orderId]
        return copy
      })

      // refresh orders for sector sync
      await fetchOrders()
    },
    [fetchOrders]
  )

  /* =====================
     Prepared DB actions
  ===================== */
  const addPreparedEntryToDb = useCallback(async () => {
    const pid = selectedProductId
    const qty = clampNonNegative(batchQty)
    if (!pid || qty <= 0) return

    const { error } = await supabase.rpc('add_prepared_qty', {
      p_product_id: pid,
      p_qty: qty,
    })

    if (error) {
      console.error('[Staff] add_prepared_qty error:', error)
      return
    }

    setBatchQty(0)

    // immediate UI update
    await fetchPreparedInventory()
  }, [selectedProductId, batchQty, fetchPreparedInventory])

  const removePreparedEntryFromDb = useCallback(
    async (productId: string) => {
      // optimistic UI remove
      setPreparedList(prev => prev.filter(p => p.productId !== productId))

      const { error } = await supabase.from('prepared_inventory').delete().eq('product_id', productId)
      if (error) {
        console.error('[Staff] removePreparedEntryFromDb error:', error)
        await fetchPreparedInventory()
      }
    },
    [fetchPreparedInventory]
  )

  const clearPreparedDb = useCallback(async () => {
    const { error } = await supabase.rpc('clear_prepared_inventory')
    if (error) console.error('[Staff] clear_prepared_inventory error:', error)

    setAllocation({})
    await fetchPreparedInventory()
  }, [fetchPreparedInventory])

  /* =====================
     APPLY FIFO PREP
  ===================== */
  const applyFIFOPreparation = async () => {
    if (preparedList.length === 0) return

    const alloc = allocateFIFO(
      orders.filter(o => o.status !== 'completed'),
      preparedList
    )
    setAllocation(alloc)

    const toReady = orders
      .filter(o => o.status !== 'completed')
      .filter(o => orderSatisfiedByAllocation(o, alloc))
      .filter(o => o.status !== 'ready')

    for (const order of toReady) {
      await updateOrderStatus(order.id, 'ready')
      setOrderStatusUI(prev => ({ ...prev, [order.id]: 'ready' }))
    }
  }

  /* =====================
     Sectors
  ===================== */
  const visibleOrders = useMemo(() => {
    return orders.filter(o => {
      // hide BCA unpaid orders from staff order list
      if (o.paymentMethod === 'bca' && !o.paid) return false
      return true
    })
  }, [orders])

  const pickupOrders = useMemo(
    () =>
      visibleOrders.filter(
        o => o.status !== 'completed' && o.deliveryMethod === 'pickup'
      ),
    [visibleOrders]
  )

  const deliveryOrders = useMemo(
    () =>
      visibleOrders.filter(
        o => o.status !== 'completed' && o.deliveryMethod === 'delivery'
      ),
    [visibleOrders]
  )

  const completedOrders = useMemo(
    () => visibleOrders.filter(o => o.status === 'completed'),
    [visibleOrders]
  )


  /* =====================
     Guards
  ===================== */
  if (authLoading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-gray-500 mt-2">Loading authentication...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-gray-500 mt-2">Please login.</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-gray-500 mt-2">Profile not found.</p>
      </div>
    )
  }

  if (!(profile.role === 'admin' || profile.role === 'staff')) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-gray-500 mt-2">You do not have access.</p>
      </div>
    )
  }

  /* =====================
     Render Order Card
  ===================== */
  const renderOrder = (order: Order) => {
    const currentStatus =
      orderStatusUI[order.id] ??
      (order.status === 'ready' || order.status === 'completed' ? order.status : 'preparing')

    const alloc = allocation[order.id] ?? {}
    const satisfied = allocation[order.id] ? orderSatisfiedByAllocation(order, allocation) : false

    return (
      <div key={order.id} className="border rounded-xl p-4 shadow-sm bg-white space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold">
              {order.orderNumber}{' '}
              <span className="text-sm text-gray-500">({order.status})</span>{' '}
              {satisfied ? <span className="text-green-600 text-sm font-semibold">READY BY FIFO</span> : null}
            </div>

            <div className="text-sm text-gray-600">
              {order.customerName ? `Name: ${order.customerName}` : 'Name: -'}
              {order.customerPhone ? ` • Phone: ${order.customerPhone}` : ''}
            </div>

            <div className="text-sm text-gray-600">
              Total: {order.total} • {order.paymentMethod} •{' '}
              {order.deliveryMethod === 'delivery'
                ? `Delivery: ${order.deliveryAddress ?? '-'}` 
                : 'Pickup'}
            </div>

            {order.notes ? (
              <div className="text-sm text-gray-500 mt-1">Notes: {order.notes}</div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              className={statusBtnClass(currentStatus === 'preparing')}
              onClick={() => {
                setOrderStatusUI(prev => ({ ...prev, [order.id]: 'preparing' }))
                void updateOrderStatus(order.id, 'preparing')
              }}
            >
              Preparing
            </button>

            <button
              className={statusBtnClass(currentStatus === 'ready')}
              onClick={() => {
                setOrderStatusUI(prev => ({ ...prev, [order.id]: 'ready' }))
                void updateOrderStatus(order.id, 'ready')
              }}
            >
              Ready
            </button>

            <button
              className={statusBtnClass(currentStatus === 'completed')}
              onClick={async () => {
                setOrderStatusUI(prev => ({ ...prev, [order.id]: 'completed' }))

                // 1) mark completed
                await updateOrderStatus(order.id, 'completed')

                // 2) consume prepared pool
                const { error } = await supabase.rpc('consume_prepared_for_order', {
                  p_order_id: order.id,
                })
                if (error) console.error('[Staff] consume_prepared_for_order error:', error)

                // 3) refresh prepared immediately
                await fetchPreparedInventory()

                // 4) clear allocation for this order
                setAllocation(prev => {
                  const next = { ...prev }
                  delete next[order.id]
                  return next
                })
              }}
            >
              Complete
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map(item => {
            const pid = item.product.id
            const got = alloc[pid] ?? 0
            const ok = got >= item.quantity

            return (
              <div
                key={item.orderItemId}
                className="flex items-center justify-between gap-4 border rounded-lg p-3"
              >
                <div>
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-gray-600">
                    Need: {item.quantity}{' '}
                    {allocation[order.id] ? (
                      <>
                        • Prepared now:{' '}
                        <span className={ok ? 'text-green-600 font-semibold' : ''}>{got}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {allocation[order.id] ? (
                  <div className="text-sm font-semibold">
                    {ok ? <span className="text-green-600">OK</span> : <span className="text-orange-600">WAIT</span>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Not prepared yet</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* =====================
     Render
  ===================== */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Staff Orders</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate('/staff/payment-verification')}
          >
            Payment Verification
          </Button>

          {/* ✅ Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={deliveryFilter}
              onChange={e => setDeliveryFilter(e.target.value as 'all' | 'pickup' | 'delivery')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All</option>
              <option value="pickup">Pickup only</option>
              <option value="delivery">Delivery only</option>
            </select>
          </div>

          <button
            onClick={() => void fetchOrders()}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TOP FIFO PREP TOOL */}
      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
        <div className="font-semibold">FIFO Preparation Tool (DB Synced)</div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Product</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[220px]"
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Prepared Quantity</label>
            <input
              type="number"
              min={0}
              value={batchQty}
              onChange={e => setBatchQty(Number(e.target.value))}
              className="px-3 py-2 border rounded-md w-[160px]"
            />
          </div>

          <button
            onClick={() => void addPreparedEntryToDb()}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Add
          </button>

          <button
            onClick={() => void applyFIFOPreparation()}
            className="px-4 py-2 rounded-md bg-black text-white hover:opacity-90"
          >
            Apply FIFO
          </button>

          <button
            onClick={() => void clearPreparedDb()}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>

        {preparedList.length > 0 ? (
          <div className="pt-2 space-y-2">
            <div className="text-sm text-gray-600 font-medium">Prepared Inputs (shared):</div>
            <div className="flex flex-wrap gap-2">
              {preparedList.map(p => {
                const prod = products.find(x => x.id === p.productId)
                return (
                  <div
                    key={p.productId}
                    className="px-3 py-1 rounded-full border text-sm flex items-center gap-2"
                  >
                    <span className="font-semibold">{prod?.name ?? 'Unknown'}</span>
                    <span>={p.qty}</span>
                    <button
                      className="text-red-600 font-bold"
                      onClick={() => void removePreparedEntryFromDb(p.productId)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No prepared input yet.</div>
        )}
      </div>

      {ordersError ? (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">
          <div className="font-semibold mb-1">Error loading orders</div>
          <div>{ordersError}</div>
        </div>
      ) : null}

      {ordersLoading ? (
        <div className="text-gray-500">Loading orders...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PICKUP */}
          <div className="space-y-3">
            <div className="font-semibold text-lg">Pickup</div>
            {pickupOrders.length === 0 ? (
              <div className="text-gray-500 text-sm">No pickup orders.</div>
            ) : (
              pickupOrders.map(renderOrder)
            )}
          </div>

          {/* DELIVERY */}
          <div className="space-y-3">
            <div className="font-semibold text-lg">Delivery</div>
            {deliveryOrders.length === 0 ? (
              <div className="text-gray-500 text-sm">No delivery orders.</div>
            ) : (
              deliveryOrders.map(renderOrder)
            )}
          </div>

          {/* COMPLETED */}
          <div className="space-y-3">
            <div className="font-semibold text-lg">Completed</div>
            {completedOrders.length === 0 ? (
              <div className="text-gray-500 text-sm">No completed orders.</div>
            ) : (
              completedOrders.map(renderOrder)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
