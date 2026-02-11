import React from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

const Login: React.FC = () => {

  const loginWithGoogle = async () => {

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard"
      }
    })

    if (error) {
      console.error(error)
      alert("Login failed")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">

      <div className="card-bakery p-8 text-center space-y-6">

        <h1 className="text-2xl font-bold">
          Sign in
        </h1>

        <Button
          className="w-full rounded-full"
          onClick={loginWithGoogle}
        >
          Continue with Google
        </Button>

      </div>

    </div>
  )
}

export default Login
