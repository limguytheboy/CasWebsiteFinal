// src/hooks/useRequireRole.ts
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type Role = 'user' | 'staff' | 'admin'

export function useRequireRole(allowed: Role[]) {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // IMPORTANT: stabilize allowed so effect doesn't rerun every render
  const allowedKey = useMemo(() => allowed.slice().sort().join('|'), [allowed])
  const allowedSet = useMemo(() => new Set<Role>(allowed), [allowedKey])

  useEffect(() => {
    // wait for auth context to finish resolving
    if (loading) return

    // not logged in
    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }

    /**
     * If logged in but profile missing:
     * - DO NOT redirect to /login (causes loop)
     * - instead send to dashboard or show page-level loading
     *
     * Best choice: send to /dashboard (safe)
     */
    if (!profile) {
      navigate('/dashboard', { replace: true })
      return
    }

    // role not allowed
    if (!allowedSet.has(profile.role)) {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [loading, user, profile, navigate, location.pathname, allowedKey, allowedSet])
}
