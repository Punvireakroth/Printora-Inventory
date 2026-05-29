'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { setAuthPersistPreferenceCookie } from '@/features/auth/session-preference-client'
import {
  mapAuthErrorToMessageKey,
  type AuthErrorMessageKey,
} from '@/features/auth/auth-error-keys'
import { sanitizeRouterPath } from '@/lib/site-url'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { BrandLogo } from '@/components/layout/brand-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLoadingContext } from '@/components/layout/loading-provider'
import {
  useLoadingAction,
  useNavigationLoading,
} from '@/hooks/use-loading-action'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const PasswordSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean(),
})

type PasswordFields = z.infer<typeof PasswordSignInSchema>

export function LoginPanel () {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('auth.errors')
  const tLayout = useTranslations('layout')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authErrorKey, setAuthErrorKey] =
    useState<AuthErrorMessageKey | null>(null)
  const { isLoading } = useLoadingContext()
  const { run } = useLoadingAction()
  const startNavigation = useNavigationLoading()

  const nextHref = useMemo(() => {
    const rawNext = searchParams.get('next')
    return sanitizeRouterPath(rawNext, locale as 'en' | 'km', '/')
  }, [searchParams, locale])

  const passwordForm = useForm<PasswordFields>({
    resolver: zodResolver(PasswordSignInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  })

  async function onPasswordSubmit (values: PasswordFields) {
    await run(async () => {
      setAuthErrorKey(null)
      setAuthPersistPreferenceCookie(values.rememberMe)

      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      if (error) {
        setAuthErrorKey(mapAuthErrorToMessageKey(error))
        return
      }

      startNavigation()
      router.replace(nextHref)
      router.refresh()
    })
  }

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <header className='flex shrink-0 items-start justify-between gap-4 p-4 md:p-6'>
        <BrandLogo
          alt={tLayout('brandMark')}
          href='/'
          priority
          size='lg'
        />
      </header>

      <main className='flex flex-1 flex-col justify-center px-6 pb-12 md:px-16'>
        <div className='mx-auto w-full max-w-[400px] space-y-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight text-foreground'>
            {t('signInTitle')}
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {t('signInSubtitle')}
          </p>
        </div>

        <div className='mx-auto mt-8 w-full max-w-[400px] space-y-5'>
          {authErrorKey
            ? (
              <p className='text-destructive text-sm' role='alert'>
                {tErrors(authErrorKey)}
              </p>
            )
            : null}

          <form
            className='space-y-4'
            noValidate
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          >
            <div className='space-y-2'>
              <label
                className='text-sm font-medium text-foreground'
                htmlFor='login-email'
              >
                {t('emailLabel')}
              </label>
              <Input
                {...passwordForm.register('email')}
                autoComplete='email'
                disabled={passwordForm.formState.isSubmitting || isLoading}
                id='login-email'
                inputMode='email'
                spellCheck={false}
              />
              {passwordForm.formState.errors.email
                ? (
                  <p className='text-destructive text-xs'>
                    {t('validation.email')}
                  </p>
                )
                : null}
            </div>

            <div className='space-y-2'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <label
                  className='text-sm font-medium text-foreground'
                  htmlFor='login-password'
                >
                  {t('passwordLabel')}
                </label>
                <Link
                  className='text-primary text-xs font-medium hover:underline'
                  href='/forgot-password'
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                {...passwordForm.register('password')}
                autoComplete='current-password'
                disabled={passwordForm.formState.isSubmitting || isLoading}
                id='login-password'
                type='password'
              />
              {passwordForm.formState.errors.password
                ? (
                  <p className='text-destructive text-xs'>
                    {t('validation.passwordRequired')}
                  </p>
                )
                : null}
            </div>

            <label className='flex cursor-pointer items-center gap-2 text-sm'>
              <input
                className='size-4 rounded border-border accent-brand-red'
                type='checkbox'
                {...passwordForm.register('rememberMe')}
              />
              <span className='text-foreground'>{t('rememberMe')}</span>
            </label>

            <Button
              aria-busy={passwordForm.formState.isSubmitting || isLoading}
              className='h-11 w-full shadow-none md:text-sm'
              disabled={passwordForm.formState.isSubmitting || isLoading}
              size='lg'
              type='submit'
            >
              {passwordForm.formState.isSubmitting || isLoading
                ? tCommon('loading')
                : t('signInWithEmail')}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
