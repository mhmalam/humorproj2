'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminSignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.refresh()
    setIsLoading(false)
  }

  return (
    <button
      onClick={signOut}
      disabled={isLoading}
      className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
