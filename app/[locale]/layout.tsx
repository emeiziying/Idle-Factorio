import Providers from '@/app/providers'
import Navigation from '@/components/Navigation'
import { locales } from '@/config'
import clsx from 'clsx'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  unstable_setRequestLocale,
} from 'next-intl/server'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale },
}: Omit<Props, 'children'>) {
  const t = await getTranslations({ locale })

  return {
    title: t('landing.skip'),
    description: t('landing.bypass'),
  } satisfies Metadata
}

export default async function RootLayout({
  children,
  params: { locale },
}: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html className="h-full" lang={locale}>
      <body className={clsx(inter.className, 'flex h-full flex-col')}>
        <NextIntlClientProvider messages={messages}>
          <Navigation />
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
