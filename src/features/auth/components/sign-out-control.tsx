'use client'

import {
  clearAuthPersistPreferenceCookie,
} from '@/features/auth/session-preference-client'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type Props = {
  className?: string
}

/** Clears persisted session preference and signs out; middleware drops auth cookies on the following response. */
export function SignOutControl ({ className }: Props) {
  const router = useRouter()
  const t = useTranslations('auth')


  const [pending, setPending] = useState(false)

  async function signOut () {
    setPending(true)
    clearAuthPersistPreferenceCookie()
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
    setPending(false)
  }

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={() => signOut()}
      type='button'
      variant='outline'
    >
      {t('signOut')}
    </Button>
  )
}
