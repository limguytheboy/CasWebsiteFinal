import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrderContext';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-accent/20 text-accent-foreground', icon: Package },
  ready: { label: 'Ready for Pickup', color: 'bg-accent/30 text-accent-foreground', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-accent/20 text-accent-foreground', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const OrderDetail: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder } = useOrders();
  const order = orderId ? getOrder(orderId) : null;

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link to="/dashboard">
          <Button className="mt-4 rounded-full">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

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
        {/* Order Info */}
        <div className="lg:col-span-2">
          <div className="card-bakery">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Order {order.id}</h1>
                <p className="mt-1 text-muted-foreground">
                  Placed on {format(order.createdAt, 'MMMM d, yyyy')} at {format(order.createdAt, 'h:mm a')}
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${status.color}`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h2 className="font-bold text-foreground">Items</h2>
              <div className="mt-4 space-y-4">
                {order.items.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-8">
                <h2 className="font-bold text-foreground">Order Notes</h2>
                <p className="mt-2 text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card-bakery">
            <h2 className="font-bold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Method</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Pickup Location:</strong> School Cafeteria, Building A
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>Pickup Time:</strong> Lunch break (12:00 - 1:00 PM)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
