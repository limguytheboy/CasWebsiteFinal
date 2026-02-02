import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created. Please log in.')
    navigate('/login')
  }

  return (
    <form onSubmit={handleSignup} className="card-bakery max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

      <Label>Email</Label>
      <Input value={email} onChange={e => setEmail(e.target.value)} />

      <Label className="mt-4">Password</Label>
      <Input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <Button className="mt-6 w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

export default Signup
