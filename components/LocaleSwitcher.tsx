import { locales } from '@/config'
import { useLocale, useTranslations } from 'next-intl'
import LocaleSwitcherSelect from './LocaleSwitcherSelect'

export default function LocaleSwitcher() {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <LocaleSwitcherSelect defaultValue={locale} label="">
      {locales.map((cur) => (
        <option key={cur} value={cur}>
          {t('locale', { locale: cur })}
        </option>
      ))}
    </LocaleSwitcherSelect>
  )
}
