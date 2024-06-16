import { locales } from '@/config'
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound()

  return {
    messages: {
      ...(await import(`./i18n/${locale}.json`)).default,
      ...(await import(`./data/i18n/${locale}.json`)).default,
    },
  }
})
