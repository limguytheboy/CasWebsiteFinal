import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'preparing' | 'ready';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  confirmed: { label: 'Confirmed', color: 'text-primary', bgColor: 'bg-primary/10' },
  preparing: { label: 'Preparing', color: 'text-accent-foreground', bgColor: 'bg-accent/20' },
  ready: { label: 'Ready', color: 'text-accent-foreground', bgColor: 'bg-accent/30' },
  completed: { label: 'Completed', color: 'text-accent-foreground', bgColor: 'bg-accent/20' },
  cancelled: { label: 'Cancelled', color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [filter, setFilter] = useState<FilterStatus>('all');

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    navigate('/login');
    return null;
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as any);
    toast.success(`Order status updated to ${statusConfig[newStatus].label}`);
  };

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Staff Portal</h1>
          <p className="mt-1 text-muted-foreground">Manage and fulfill orders</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {(['all', 'pending', 'preparing', 'ready'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            className="rounded-full capitalize"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All Orders' : status}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
              {orderCounts[status]}
            </span>
          </Button>
        ))}
      </div>

      {/* Orders */}
      <div className="mt-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="card-bakery py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">
              No {filter === 'all' ? '' : filter} orders
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const status = statusConfig[order.status];
            return (
              <div key={order.id} className="card-bakery">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">{order.id}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(order.createdAt, 'MMMM d, yyyy')} at {format(order.createdAt, 'h:mm a')}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary">${order.total.toFixed(2)}</p>
                </div>

                {/* Items */}
                <div className="mt-4 rounded-xl bg-muted p-4">
                  <p className="mb-2 text-sm font-medium text-foreground">Order Items:</p>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <span className="flex-1 text-sm text-foreground">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mt-4 flex items-start gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Note:</span> {order.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Order
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleStatusChange(order.id, 'ready')}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleStatusChange(order.id, 'completed')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Order
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Staff;
