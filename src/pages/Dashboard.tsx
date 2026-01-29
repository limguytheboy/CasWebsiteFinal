import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, ChevronRight, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getOrdersByUser } = useOrders();

  if (!user) {
    navigate('/login');
    return null;
  }

  const orders = getOrdersByUser(user.id);
  const recentOrders = orders.slice(0, 3);

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
            {/* User Info */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {user.name.charAt(0)}
              </div>
              <h2 className="mt-3 font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.role !== 'customer' && (
                <span className="mt-2 inline-block badge-caramel capitalize">
                  {user.role}
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="mt-6 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary"
              >
                <User className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                to="/dashboard/orders"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's an overview of your account
          </p>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card-bakery">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{orders.length}</p>
            </div>
            <div className="card-bakery">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 text-3xl font-bold text-primary">
                {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
              </p>
            </div>
            <div className="card-bakery">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="mt-1 text-3xl font-bold text-accent">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
              <Link to="/dashboard/orders" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="mt-4 card-bakery text-center">
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                <Link to="/products">
                  <Button className="mt-4 rounded-full">Browse Treats</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {recentOrders.map(order => (
                  <Link
                    key={order.id}
                    to={`/order/${order.id}`}
                    className="flex items-center justify-between card-bakery group"
                  >
                    <div>
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(order.createdAt, 'MMM d, yyyy')} • {order.items.length} items
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">
                        ${order.total.toFixed(2)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
