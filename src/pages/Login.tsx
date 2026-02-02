import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const shouldIgnoreAuthWarning = (message: string) => {
    const msg = message.toLowerCase()
    return (
      msg.includes('leaked') ||
      msg.includes('hibp') ||
      msg.includes('pwned') ||
      msg.includes('compromised password')
    )
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Logged in successfully!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        // ✅ Hide Supabase leaked password warning (HIBP)
        if (shouldIgnoreAuthWarning(err.message)) {
          // do nothing (silent)
          return
        }
        toast.error(err.message)
      } else {
        toast.error('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="card-bakery max-w-md mx-auto mt-12 space-y-4 p-6 shadow-lg rounded-lg bg-white"
    >
      <h1 className="text-2xl font-bold text-center">Sign In</h1>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="********"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      <Button className="mt-4 w-full" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don’t have an account?{' '}
        <Link to="/signup" className="text-primary underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}

export default Login
