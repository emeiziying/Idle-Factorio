import AutoSave from '@/components/AutoSave'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from './LocaleSwitcher'

export default function Navigation() {
  const t = useTranslations('app')

  return (
    <div className="flex justify-center">
      <nav className="container flex justify-between p-2">
        <div />
        <div className="flex items-center">
          <AutoSave />
          <LocaleSwitcher />
        </div>
      </nav>
    </div>
  )
}
