import React, { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrders } from '@/contexts/OrderContext'

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams()
  const { orders, loading, fetchOrders } = useOrders()

  // Ensure orders are loaded (important when user refreshes page)
  useEffect(() => {
    if (!orders.length) fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const order = useMemo(() => {
    if (!orderId) return null
    return orders.find(o => o.id === orderId) ?? null
  }, [orders, orderId])

  // Loading state
  if (loading) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Loading order...</h1>
      </div>
    )
  }

  // Not found state
  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link to="/dashboard">
          <Button className="mt-4 rounded-full">Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-12 animate-fade-in">
      <div className="mx-auto max-w-2xl text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
          <CheckCircle className="h-10 w-10 text-accent" />
        </div>

        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Order Confirmed!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Thank you for your order. We're getting your treats ready!
        </p>

        {/* Order Number */}
        <div className="mt-8 rounded-2xl bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Order Number</p>
          <p className="mt-1 text-xl font-bold text-primary">{order.id}</p>
        </div>

        {/* Order Details */}
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-card text-left">
          <h2 className="font-bold text-foreground">Order Details</h2>

          <div className="mt-4 space-y-3">
            {(order.items ?? []).map((item, idx) => (
              <div key={item.product.id ?? idx} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.product.name}
                </span>
                <span className="font-medium text-foreground">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}


            <hr className="border-border" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 rounded-2xl bg-muted p-6">
          <div className="flex items-start gap-4">
            <Package className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div className="text-left">
              <p className="font-bold text-foreground">Pickup Information</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your order will be ready for pickup during lunch break at the school cafeteria.
                Please show your order number when collecting.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to={`/order/${order.id}`}>
            <Button variant="outline" className="w-full rounded-full sm:w-auto">
              View Order Details
            </Button>
          </Link>

          <Link to="/products">
            <Button className="w-full rounded-full sm:w-auto">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
