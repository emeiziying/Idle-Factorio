import '@/app/globals.css'
import Providers from '@/app/providers'
import Navigation from '@/components/Navigation'
import { locales } from '@/config'
import type { ModData, ModHash, ModI18n } from '@/models'
import clsx from 'clsx'
import { promises as fs } from 'fs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import {
  getMessages,
  getTranslations,
  unstable_setRequestLocale,
} from 'next-intl/server'
import { Inter } from 'next/font/google'
import { type ReactNode } from 'react'

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

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  const dataJSON = await fs.readFile(process.cwd() + '/data/data.json', 'utf8')
  const hashJSON = await fs.readFile(process.cwd() + '/data/hash.json', 'utf8')
  const i18nJSON = await fs.readFile(
    process.cwd() + `/data/i18n/${locale}.json`,
    'utf8',
  )

  const dataset = {
    data: { id: '1.1', value: JSON.parse(dataJSON) as ModData },
    hash: { id: '1.1', value: JSON.parse(hashJSON) as ModHash },
    i18n: { id: `1.1-${locale}`, value: JSON.parse(i18nJSON) as ModI18n },
  }

  return (
    <html lang={locale}>
      <body className={clsx(inter.className, 'flex min-h-full flex-col')}>
        <Providers dataset={dataset} locale={locale}>
          <NextIntlClientProvider messages={messages}>
            <Navigation />
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  )
}
