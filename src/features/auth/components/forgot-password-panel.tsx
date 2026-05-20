'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LanguageSwitcher } from '@/features/i18n/components/language-switcher'
import {
  mapAuthErrorToMessageKey,
  type AuthErrorMessageKey,
} from '@/features/auth/auth-error-keys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPublicSiteOrigin } from '@/lib/site-url'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const ForgotSchema = z.object({
  email: z.string().email(),
})

type ForgotFields = z.infer<typeof ForgotSchema>;

export function ForgotPasswordPanel () {
  const t = useTranslations('auth')
  const tErrors = useTranslations('auth.errors')
  const locale = useLocale()

  const [banner, setBanner] = useState<'none' | 'sent'>('none')
  const [submitErrorKey, setSubmitErrorKey] =
    useState<AuthErrorMessageKey | null>(null)

  const form = useForm<ForgotFields>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit (values: ForgotFields) {
    form.clearErrors()
    setSubmitErrorKey(null)
    setBanner('none')

    const supabase = createSupabaseBrowserClient()
    const redirectTo =
      `${getPublicSiteOrigin()}/${locale}/auth/callback?next=${encodeURIComponent(
        `/${locale}/update-password`,
      )}`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      values.email.trim().toLowerCase(),
      { redirectTo },
    )

    if (error) {
      setSubmitErrorKey(mapAuthErrorToMessageKey(error))
      return
    }

    form.reset()
    setBanner('sent')
  }

  return (
    <div className='flex min-h-[100dvh] flex-col bg-background'>
      <header className='flex shrink-0 items-start justify-between gap-4 p-6 md:p-8'>
        <Link className='text-sm font-medium text-muted-foreground hover:text-foreground' href='/login'>
          {t('resetEmail.back')}
        </Link>
        <LanguageSwitcher />
      </header>
      <main className='flex flex-1 flex-col justify-center px-6 pb-16 md:px-16'>
        <div className='mx-auto w-full max-w-[400px] space-y-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight text-foreground'>
            {t('resetEmail.title')}
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {t('resetEmail.subtitle')}
          </p>
        </div>
        <form
          className='mx-auto mt-8 flex w-full max-w-[400px] flex-col gap-4'
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {submitErrorKey
            ? (
              <p className='text-destructive text-sm' role='alert'>
                {tErrors(submitErrorKey)}
              </p>
            )
            : null}
          {banner === 'sent'
            ? (
              <p className='text-sm text-muted-foreground' role='status'>
                {t('resetEmail.sent')}
              </p>
            )
            : null}
          <div className='space-y-2'>
            <label
              className='text-sm font-medium text-foreground'
              htmlFor='forgot-email'
            >
              {t('emailLabel')}
            </label>
            <Input
              {...form.register('email')}
              autoComplete='email'
              disabled={form.formState.isSubmitting}
              id='forgot-email'
              inputMode='email'
              placeholder={t('emailPlaceholder')}
              spellCheck={false}
            />
            {form.formState.errors.email
              ? (
                <p className='text-destructive text-xs'>{t('validation.email')}</p>
              )
              : null}
          </div>
          <Button
            className='h-11 w-full shadow-none'
            disabled={form.formState.isSubmitting}
            size='lg'
            type='submit'
          >
            {t('resetEmail.cta')}
          </Button>
        </form>
      </main>
    </div>
  )
}
