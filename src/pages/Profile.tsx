import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, Shield, Users, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateUser({ name, phone, address });
    toast.success('Profile updated successfully!');
    setIsSaving(false);
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
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Package className="h-5 w-5" />
                My Orders
              </Link>
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary"
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Profile Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your personal information</p>

          <form onSubmit={handleSave} className="mt-8 card-bakery">
            <div className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="input-bakery mt-1 bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-bakery mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-bakery mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Default Pickup Notes</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="e.g., Class 10B, usually at main entrance"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-bakery mt-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 rounded-full"
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Profile;
