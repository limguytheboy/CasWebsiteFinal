import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, ChevronRight, Shield, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary' },
  preparing: { label: 'Preparing', color: 'bg-accent/20 text-accent-foreground' },
  ready: { label: 'Ready', color: 'bg-accent/30 text-accent-foreground' },
  completed: { label: 'Completed', color: 'bg-accent/20 text-accent-foreground' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
};

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getOrdersByUser } = useOrders();

  if (!user) {
    navigate('/login');
    return null;
  }

  const orders = getOrdersByUser(user.id);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card-bakery">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {user.name.charAt(0)}
              </div>
              <h2 className="mt-3 font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <nav className="mt-6 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <User className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                to="/dashboard/orders"
                className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary"
              >
                <Package className="h-5 w-5" />
                My Orders
              </Link>
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Profile Settings
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Shield className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              )}
              {(user.role === 'staff' || user.role === 'admin') && (
                <Link
                  to="/staff"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Staff Portal
                </Link>
              )}
            </nav>

            <hr className="my-4 border-border" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Orders</h1>
          <p className="mt-1 text-muted-foreground">View and track your order history</p>

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
                const status = statusConfig[order.status];
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
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format(order.createdAt, 'MMMM d, yyyy')} at {format(order.createdAt, 'h:mm a')}
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
                      {order.items.slice(0, 3).map(item => (
                        <img
                          key={item.product.id}
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrderHistory;
