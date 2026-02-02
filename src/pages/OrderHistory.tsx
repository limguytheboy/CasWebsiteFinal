import React from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, ArrowLeft } from 'lucide-react'
import { useOrders } from '@/contexts/OrderContext'
import { format } from 'date-fns'

type OrderStatusConfig = {
  label: string
  color: string
}

const statusConfig: Record<string, OrderStatusConfig> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary' },
  preparing: { label: 'Preparing', color: 'bg-accent/20 text-accent-foreground' },
  ready: { label: 'Ready', color: 'bg-accent/30 text-accent-foreground' },
  completed: { label: 'Completed', color: 'bg-accent/20 text-accent-foreground' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
}

const OrderHistory: React.FC = () => {
  const { orders } = useOrders()

  return (
    <div className="container py-8 animate-fade-in">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-foreground md:text-3xl">
        Order History
      </h1>
      <p className="mt-1 text-muted-foreground">View all placed orders</p>

      {orders.length === 0 ? (
        <div className="mt-8 card-bakery text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No orders yet</p>
          <Link to="/products">
            <button className="btn-bakery mt-4">Start Shopping</button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map(order => {
            const status =
              statusConfig[order.status] ??
              statusConfig.pending // fallback if status missing

            // ✅ FIX: safe date conversion
            const createdAt =
              order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
            const createdAtValid = !isNaN(createdAt.getTime())

            return (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="card-bakery group block"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-foreground">{order.id}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {createdAtValid ? format(createdAt, 'MMMM d, yyyy') : 'Unknown date'} at{' '}
                      {createdAtValid ? format(createdAt, 'h:mm a') : '--:--'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-primary">
                      ${order.total.toFixed(2)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {(order.items ?? []).slice(0, 3).map(item => (
                    <img
                      key={item.product.id}
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ))}

                  {(order.items ?? []).length > 3 && (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                      +{(order.items ?? []).length - 3}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
