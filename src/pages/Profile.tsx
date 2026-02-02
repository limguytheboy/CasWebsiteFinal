// src/pages/Profile.tsx

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Package, Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const Profile: React.FC = () => {
  const { user, profile, loading, refreshProfile } = useAuth()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  /* ---------- Load profile ---------- */
  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  if (loading) return <div className="p-8">Loading…</div>
  if (!user) return <div className="p-8">Not logged in</div>

  /* ---------- Save ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone,
      })
      .eq('id', user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Profile updated')
      await refreshProfile()
    }

    setIsSaving(false)
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card-bakery text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {name.charAt(0) || 'U'}
            </div>
            <h2 className="mt-3 font-bold">{name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>

            <nav className="mt-6 space-y-1 text-left">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <User className="h-5 w-5" />
                Dashboard
              </Link>

              <Link
                to="/dashboard/orders"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Package className="h-5 w-5" />
                Orders
              </Link>

              <Link
                to="/dashboard/profile"
                className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary"
              >
                <Settings className="h-5 w-5" />
                Profile
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-3">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your information
          </p>

          <form onSubmit={handleSave} className="mt-8 card-bakery space-y-6">
            <div>
              <Label>Email</Label>
              <Input value={user.email ?? ''} disabled />
            </div>

            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </main>
      </div>
    </div>
  )
}

export default Profile
