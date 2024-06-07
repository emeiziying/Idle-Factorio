import { useTranslations } from 'next-intl'
import LocaleSwitcher from './LocaleSwitcher'

export default function Navigation() {
  const t = useTranslations('app')

  return (
    <div className="flex justify-center">
      <nav className="container flex justify-between p-2 text-white">
        <div />
        <LocaleSwitcher />
      </nav>
    </div>
  )
}
