'use client'

import { Button } from 'primereact/button'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Button
      icon="pi pi-sign-out"
      className="p-button-text p-button-sm text-gray-500 hover:text-gray-700"
      onClick={handleSignOut}
      tooltip="Se déconnecter"
      tooltipOptions={{ position: 'bottom' }}
      aria-label="Se déconnecter"
    />
  )
}
