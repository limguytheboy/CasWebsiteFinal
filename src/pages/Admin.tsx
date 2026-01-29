import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { format } from 'date-fns';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="container py-8 animate-fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your bakery operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bakery">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bakery">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bakery">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <CheckCircle className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bakery">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/staff" className="card-bakery group flex items-center gap-4 hover:border-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Manage Orders</p>
            <p className="text-sm text-muted-foreground">Process and track orders</p>
          </div>
        </Link>
        <div className="card-bakery flex items-center gap-4 opacity-60">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Team Members</p>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        </div>
        <div className="card-bakery flex items-center gap-4 opacity-60">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Analytics</p>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-foreground">All Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                <th className="pb-3 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Items</th>
                <th className="pb-3 font-medium text-muted-foreground">Total</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-border">
                  <td className="py-4 font-medium text-foreground">{order.id}</td>
                  <td className="py-4 text-muted-foreground">
                    {format(order.createdAt, 'MMM d, h:mm a')}
                  </td>
                  <td className="py-4 text-muted-foreground">{order.items.length} items</td>
                  <td className="py-4 font-medium text-foreground">${order.total.toFixed(2)}</td>
                  <td className="py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-4">
                    <Link
                      to={`/order/${order.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
