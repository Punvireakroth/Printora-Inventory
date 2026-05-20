'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LanguageSwitcher } from '@/features/i18n/components/language-switcher'
import {
  mapAuthErrorToMessageKey,
  type AuthErrorMessageKey,
} from '@/features/auth/auth-error-keys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const UpdatePwSchema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
  })

type Fields = z.infer<typeof UpdatePwSchema>;

export function UpdatePasswordPanel () {
  const router = useRouter()
  const t = useTranslations('auth')
  const tErrors = useTranslations('auth.errors')
  const [authErrorKey, setAuthErrorKey] =
    useState<AuthErrorMessageKey | null>(null)

  const form = useForm<Fields>({
    resolver: zodResolver(UpdatePwSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit (values: Fields) {
    setAuthErrorKey(null)
    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setAuthErrorKey(mapAuthErrorToMessageKey(error))
      return
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <div className='flex min-h-[100dvh] flex-col bg-background'>
      <header className='flex shrink-0 items-start justify-between gap-4 p-6 md:p-8'>
        <Link className='text-sm font-medium text-muted-foreground hover:text-foreground' href='/login'>
          {t('updatePassword.cancel')}
        </Link>
        <LanguageSwitcher />
      </header>

      <main className='flex flex-1 flex-col justify-center px-6 pb-16 md:px-16'>
        <div className='mx-auto w-full max-w-[400px] space-y-2'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight text-foreground'>
            {t('updatePassword.title')}
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {t('updatePassword.subtitle')}
          </p>
        </div>

        <form
          className='mx-auto mt-8 flex w-full max-w-[400px] flex-col gap-4'
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {authErrorKey
            ? (
              <p className='text-destructive text-sm' role='alert'>
                {tErrors(authErrorKey)}
              </p>
            )
            : null}

          <div className='space-y-2'>
            <label
              className='text-sm font-medium text-foreground'
              htmlFor='npw'
            >
              {t('updatePassword.passwordLabel')}
            </label>
            <Input
              {...form.register('password')}
              autoComplete='new-password'
              disabled={form.formState.isSubmitting}
              id='npw'
              type='password'
            />
            {form.formState.errors.password
              ? (
                <p className='text-destructive text-xs'>
                  {t('validation.passwordWeak')}
                </p>
              )
              : null}
          </div>
          <div className='space-y-2'>
            <label
              className='text-sm font-medium text-foreground'
              htmlFor='npw2'
            >
              {t('updatePassword.confirmLabel')}
            </label>
            <Input
              {...form.register('confirm')}
              autoComplete='new-password'
              disabled={form.formState.isSubmitting}
              id='npw2'
              type='password'
            />
            {form.formState.errors.confirm
              ? (
                <p className='text-destructive text-xs'>
                  {t('validation.confirmMismatch')}
                </p>
              )
              : null}
          </div>
          <Button
            className='h-11 w-full shadow-none'
            disabled={form.formState.isSubmitting}
            size='lg'
            type='submit'
          >
            {t('updatePassword.cta')}
          </Button>
        </form>
      </main>
    </div>
  )
}
