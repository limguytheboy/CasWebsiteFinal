import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Package, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { format, isValid } from 'date-fns'
import type { Order, Product } from '@/data/types'
import { toast } from 'sonner'


type OrderItemRow = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  prepared_quantity: number | null
  missing_stock: boolean | null
}

type OrderRow = {
  id: string
  order_number: string | null
  status: Order['status']
  total: number | null
  notes: string | null
  payment_method: Order['paymentMethod'] | null
  delivery_method: Order['deliveryMethod'] | null
  delivery_address: string | null
  created_at: string | null

  // optional transfer fields
  bank_name: string | null
  sender_name: string | null
  payment_proof_url: string | null

  paid: boolean | null
}

type OrderDetailItem = {
  product: Product
  quantity: number
  preparedQuantity: number
  missingStock: boolean
}

type FullOrderDetail = {
  id: string
  orderNumber: string
  status: Order['status']
  total: number
  notes?: string | null
  paymentMethod?: Order['paymentMethod'] | null
  deliveryMethod?: Order['deliveryMethod'] | null
  deliveryAddress?: string | null
  createdAt: Date | null

  senderBankName?: string | null
  senderAccountName?: string | null
  paymentProofUrl?: string | null

  items: OrderDetailItem[]
  paid?: boolean | null
}

const statusConfig: Record<
  Order['status'],
  { label: string; color: string; icon: React.ElementType }
> = {
  pending_verification: {
    label: 'Pending Verification',
    color: 'bg-muted text-muted-foreground',
    icon: Clock,
  },
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-accent/20 text-accent-foreground', icon: Package },
  ready: { label: 'Ready for Pickup', color: 'bg-accent/30 text-accent-foreground', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-accent/20 text-accent-foreground', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
}

function safeToDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return isValid(d) ? d : null
}

function safeFormatDate(value: Date | null, fmt: string) {
  if (!value) return '-'
  if (!isValid(value)) return '-'
  return format(value, fmt)
}

const OrderDetail: React.FC = () => {
  const params = useParams()
  const id = (params.id || params.orderId) as string | undefined

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<FullOrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!id) {
        setError('Missing order id')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // 1) Load order
      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          notes,
          payment_method,
          delivery_method,
          delivery_address,
          created_at,
          bank_name,
          sender_name,
          payment_proof_url
        `)
        .eq('id', id)
        .single<OrderRow>()

      if (!mounted) return

      if (orderErr || !orderRow) {
        setError('Order not found')
        setOrder(null)
        setLoading(false)
        return
      }

      // 2) Load items (NO unit_price column!)
      const { data: itemsRows, error: itemsErr } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, prepared_quantity, missing_stock')
        .eq('order_id', orderRow.id)
        .returns<OrderItemRow[]>()

      if (!mounted) return

      if (itemsErr) {
        setError(`Failed to load order items: ${itemsErr.message}`)
        setOrder(null)
        setLoading(false)
        return
      }

      const productIds = (itemsRows ?? []).map(r => r.product_id)

      // 3) Load products
      let products: Product[] = []
      if (productIds.length > 0) {
        const { data: productRows, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .returns<Product[]>()

        if (!mounted) return

        if (prodErr) {
          setError(`Failed to load products: ${prodErr.message}`)
          setOrder(null)
          setLoading(false)
          return
        }

        products = productRows ?? []
      }

      const productMap = new Map(products.map(p => [p.id, p]))

      const detailItems: OrderDetailItem[] = (itemsRows ?? [])
        .map(row => {
          const product = productMap.get(row.product_id)
          if (!product) return null

          return {
            product,
            quantity: row.quantity,
            preparedQuantity: row.prepared_quantity ?? 0,
            missingStock: row.missing_stock ?? false,
          }
        })
        .filter((x): x is OrderDetailItem => x !== null)

      const createdAt = safeToDate(orderRow.created_at)

      const full: FullOrderDetail = {
        id: orderRow.id,
        orderNumber: orderRow.order_number ?? orderRow.id,
        status: orderRow.status,
        total: Number(orderRow.total ?? 0),
        notes: orderRow.notes,
        paymentMethod: orderRow.payment_method ?? undefined,
        deliveryMethod: orderRow.delivery_method ?? undefined,
        deliveryAddress: orderRow.delivery_address ?? undefined,
        createdAt,

        senderBankName: orderRow.bank_name,
        senderAccountName: orderRow.sender_name,
        paymentProofUrl: orderRow.payment_proof_url,

        items: detailItems,
        paid: orderRow.paid,
      }

      setOrder(full)
      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [id])

  const handleCancelOrder = async () => {
    if (!order) return

    const ok = confirm('Are you sure you want to cancel this order?')
    if (!ok) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      if (error) throw error

      toast.success('Order cancelled')
      setOrder(prev => (prev ? { ...prev, status: 'cancelled' } : prev))
    } catch (e) {
      console.error(e)
      toast.error('Failed to cancel order')
    }
  }

  const paymentStatus = useMemo(() => {
    if (order?.paid === true) return 'Paid'
    if (order?.paid === false) return 'Unpaid'
    return '-'
  }, [order?.paid])


  if (loading) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Loading order...</h1>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-muted-foreground">{error ?? 'Unknown error'}</p>
        <Link to="/dashboard">
          <Button className="mt-4 rounded-full">Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left */}
        <div className="lg:col-span-2">
          <div className="card-bakery">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Order {order.orderNumber}
                </h1>

                <p className="mt-1 text-muted-foreground">
                  Placed on {safeFormatDate(order.createdAt, 'MMMM d, yyyy')} at{' '}
                  {safeFormatDate(order.createdAt, 'h:mm a')}
                </p>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Delivery Method:</strong>{' '}
                    <span className="capitalize">{order.deliveryMethod ?? '-'}</span>
                  </p>

                  {order.deliveryMethod === 'delivery' && (
                    <p>
                      <strong>Delivery Address:</strong> {order.deliveryAddress ?? '-'}
                    </p>
                  )}

                  <p>
                    <strong>Payment Method:</strong>{' '}
                    <span className="capitalize">{order.paymentMethod ?? '-'}</span>
                  </p>

                  {order.paymentMethod === 'bca' && (
                    <>
                      <p>
                        <strong>Sender Bank:</strong> {order.senderBankName ?? '-'}
                      </p>
                      <p>
                        <strong>Sender Name:</strong> {order.senderAccountName ?? '-'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${status.color}`}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h2 className="font-bold text-foreground">Items</h2>

              {order.items.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No items found for this order.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {order.items.map(item => (
                    <div key={item.product.id} className="flex gap-4">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-muted" />
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product.name}</p>

                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                          {item.preparedQuantity > 0 && (
                            <span className="ml-2">
                              • Prepared: {item.preparedQuantity}
                            </span>
                          )}
                          {item.missingStock && (
                            <span className="ml-2 font-bold text-destructive">
                              • Missing stock
                            </span>
                          )}
                        </p>
                      </div>

                      <p className="font-medium text-foreground">
                        Rp {(Number(item.product.price ?? 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-8">
                <h2 className="font-bold text-foreground">Order Notes</h2>
                <p className="mt-2 text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-1">
          <div className="card-bakery">
            <h2 className="font-bold text-foreground">Order Summary</h2>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Items</span>
                <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Payment Status</span>
                <span
                  className={
                    paymentStatus === 'Paid'
                      ? 'font-bold text-green-600'
                      : paymentStatus === 'Unpaid'
                        ? 'font-bold text-red-600'
                        : ''
                  }
                >
                  {paymentStatus}
                </span>
              </div>

              <hr className="border-border" />

              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">Rp {order.total}</span>
              </div>
            </div>

            {order.paymentMethod === 'bca' && order.paymentProofUrl && (
              <div className="mt-4">
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Payment Proof
                </a>
              </div>
            )}
          </div>

          {order.status === 'preparing' && (
            <Button
              variant="destructive"
              className="mt-4 w-full rounded-full"
              onClick={handleCancelOrder}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
