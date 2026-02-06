// src/pages/PaymentVerification.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BankName, Order, Product } from '@/data/types'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  payment_method: 'bca' | 'cash'
  paid: boolean

  // ✅ NEW
  bank_name: BankName | null
  sender_name: string | null

  payment_proof_url: string | null
  verified_by: string | null
  verified_at: string | null

  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  notes: string | null
  created_at: string
  profiles: ProfileRow | null
  order_items: OrderItemRow[]
}

/* =====================
   Helpers
===================== */
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

    // ✅ NEW
    bankName: row.bank_name ?? undefined,
    senderName: row.sender_name ?? undefined,

    paymentProofUrl: row.payment_proof_url ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,

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
        preparedQuantity: 0,
        missingStock: false,
      })),
  }
}

const badge = (txt: string, cls: string) =>
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`

function formatBankName(bank?: BankName) {
  if (!bank) return '-'
  return bank.toUpperCase()
}

export default function PaymentVerification() {
  const { user, profile, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'pending' | 'verified' | 'cancelled'>('pending')

  const navigate = useNavigate()

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const isStaffOrAdmin = useMemo(() => {
    return profile?.role === 'admin' || profile?.role === 'staff'
  }, [profile?.role])

  const fetchOrders = useCallback(async () => {
    if (!user || !profile) {
      setOrders([])
      setLoading(false)
      return
    }

    if (!isStaffOrAdmin) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        total,
        payment_method,
        paid,
        bank_name,
        sender_name,
        payment_proof_url,
        verified_by,
        verified_at,
        delivery_method,
        delivery_address,
        notes,
        created_at,

        profiles!orders_user_id_fkey (
          full_name,
          phone
        ),

        order_items (
          id,
          quantity,
          product:products ( * )
        )
      `)
      .eq('payment_method', 'bca')
      .order('created_at', { ascending: true })

    // ✅ FIXED FILTER
    if (filter === 'pending') {
      query = query
        .eq('paid', false)
        .neq('status', 'cancelled') // hide cancelled from pending
    }

    if (filter === 'verified') {
      query = query.eq('paid', true)
    }

    if (filter === 'cancelled') {
      query = query.eq('status', 'cancelled')
    }

    const { data, error } = await query

    if (error) {
      console.error('[PaymentVerification] fetchOrders error:', error)
      toast.error('Failed to load verification orders')
      setOrders([])
      setLoading(false)
      return
    }

    const mapped = (data as unknown as OrderRow[]).map(mapOrderRowToOrder)

    setOrders(mapped)
    setLoading(false)
  }, [user, profile, isStaffOrAdmin, filter])


  // realtime sync (NO ANY)
  useEffect(() => {
    if (!user || !profile || !isStaffOrAdmin) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const ch = supabase
      .channel('rt-payment-verification')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        const newRow = payload.new as Partial<OrderRow> | null
        if (newRow?.payment_method === 'bca') {
          void fetchOrders()
        }
      })
      .subscribe()

    channelRef.current = ch

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, profile, isStaffOrAdmin, fetchOrders])

  useEffect(() => {
    if (authLoading) return
    void fetchOrders()
  }, [authLoading, fetchOrders])

  const verifyPayment = useCallback(
    async (orderId: string) => {
      if (!user) return

      // optimistic UI
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
                ...o,
                paid: true,
                status: 'preparing',
                verifiedBy: user.id,
                verifiedAt: new Date(),
              }
            : o
        )
      )

      const { error } = await supabase
        .from('orders')
        .update({
        paid: true,
        status: 'confirmed',
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (error) {
        console.error('[PaymentVerification] verifyPayment error:', error)
        toast.error('Verify failed (check RLS)')
        await fetchOrders()
        return
      }

      toast.success('Payment verified → order moved to Preparing')
      await fetchOrders()
    },
    [user, fetchOrders]
  )

  const rejectPayment = useCallback(
    async (orderId: string) => {

      // remove instantly from UI
      setOrders(prev => prev.filter(o => o.id !== orderId))

      const { error } = await supabase
        .from('orders')
        .update({
          paid: false,
          status: 'cancelled',   // ✅ NEW STATUS
          verified_by: null,
          verified_at: null,
        })
        .eq('id', orderId)

      if (error) {
        console.error('[PaymentVerification] rejectPayment error:', error)
        toast.error('Reject failed')
        await fetchOrders()
        return
      }

      toast.success('Payment rejected (Canceled)')
    },
    [fetchOrders]
  )

  /* =====================
     Guards
  ===================== */
  if (authLoading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Payment Verification</h1>
        <p className="text-gray-500 mt-2">Loading authentication...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Payment Verification</h1>
        <p className="text-gray-500 mt-2">Please login.</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Payment Verification</h1>
        <p className="text-gray-500 mt-2">Profile not found.</p>
      </div>
    )
  }

  if (!isStaffOrAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Payment Verification</h1>
        <p className="text-gray-500 mt-2">You do not have access.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/staff')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Staff
            </Button>
        </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Payment Verification (Transfer)</h1>

        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-md border ${
              filter === 'pending' ? 'bg-black text-white border-black' : 'bg-white'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-2 rounded-md border ${
              filter === 'verified' ? 'bg-black text-white border-black' : 'bg-white'
            }`}
            onClick={() => setFilter('verified')}
          >
            Verified
          </button>
          <button
            className={`px-3 py-2 rounded-md border ${
              filter === 'cancelled'
                ? 'bg-black text-white border-black'
                : 'bg-white'
            }`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
          <button
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            onClick={() => void fetchOrders()}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading verification orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500">No orders found.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map(order => {
            const proof = order.paymentProofUrl

            return (
              <div key={order.id} className="border rounded-2xl p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg">
                      {order.orderNumber}{' '}
                      {/* RIGHT SIDE STATUS / ACTION */}
                      <div className="text-right text-xs text-gray-500">
                        {order.status === 'cancelled' && (
                          <>
                            <div className="font-semibold text-red-600">Cancelled</div>
                            {order.verifiedAt && (
                              <div>{order.verifiedAt.toLocaleString()}</div>
                            )}
                          </>
                        )}

                        {order.status !== 'cancelled' && order.paid && (
                          <>
                            <div className="font-semibold text-green-700">Verified</div>
                            {order.verifiedAt && (
                              <div>{order.verifiedAt.toLocaleString()}</div>
                            )}
                          </>
                        )}

                        {order.status !== 'cancelled' && !order.paid && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => void verifyPayment(order.id)}
                              className="px-3 py-2 rounded-md bg-green-600 text-white hover:opacity-90 text-sm font-semibold"
                            >
                              Verify
                            </button>

                            <button
                              onClick={() => void rejectPayment(order.id)}
                              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* ✅ Bank + Sender */}
                    <div className="mt-2 space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-500">Bank:</span>{' '}
                        <span className="font-semibold">{formatBankName(order.bankName)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Sender name:</span>{' '}
                        <span className="font-semibold">{order.senderName ?? '-'}</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mt-2">
                      {order.customerName ? `Customer: ${order.customerName}` : 'Customer: -'}
                      {order.customerPhone ? ` • ${order.customerPhone}` : ''}
                    </div>

                    <div className="text-sm text-gray-600">
                      Total: <span className="font-semibold">{order.total}</span> •{' '}
                      {order.deliveryMethod === 'delivery'
                        ? `Delivery: ${order.deliveryAddress ?? '-'}`
                        : 'Pickup'}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Status: <span className="font-semibold">{order.status}</span>
                    </div>

                    {order.notes ? (
                      <div className="text-sm text-gray-500 mt-2">Notes: {order.notes}</div>
                    ) : null}
                  </div>
                </div>

                <div className="border rounded-xl p-3">
                  <div className="text-sm font-semibold mb-2">Payment Proof</div>

                  {!proof ? (
                    <div className="text-sm text-gray-500">No proof uploaded.</div>
                  ) : (
                    <div className="space-y-2">
                      <a
                        href={proof}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        Open proof in new tab
                      </a>

                      <img
                        src={proof}
                        alt="Payment proof"
                        className="w-full max-h-[340px] object-contain rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="border rounded-xl p-3 space-y-2">
                  <div className="text-sm font-semibold">Items</div>
                  <div className="space-y-1">
                    {order.items.map(i => (
                      <div key={i.orderItemId} className="text-sm text-gray-700 flex justify-between">
                        <span>{i.product.name}</span>
                        <span className="font-semibold">×{i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}