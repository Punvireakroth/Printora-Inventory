'use client'

import {
  clearAuthPersistPreferenceCookie,
} from '@/features/auth/session-preference-client'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { useLoadingAction } from '@/hooks/use-loading-action'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

type Props = {
  className?: string
}

/** Clears persisted session preference and signs out; middleware drops auth cookies on the following response. */
export function SignOutControl ({ className }: Props) {
  const router = useRouter()
  const t = useTranslations('auth')


  const { run, isLoading } = useLoadingAction()

  async function signOut () {
    await run(async () => {
      clearAuthPersistPreferenceCookie()
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <Button
      className={className}
      disabled={isLoading}
      onClick={() => signOut()}
      type='button'
      variant='outline'
    >
      {t('signOut')}
    </Button>
  )
}
