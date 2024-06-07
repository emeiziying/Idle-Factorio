import GameContainer from '@/components/GameContainer'
import TechnologyPanel from '@/components/TechnologyPanel'
import { useTranslations } from 'next-intl'
import { unstable_setRequestLocale } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

export default function IndexPage({ params: { locale } }: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale)

  const t = useTranslations('landing')

  return (
    <main>
      <div className="flex justify-center py-10">
        <div className="w-full max-w-7xl px-6">
          <GameContainer />
          <TechnologyPanel />
        </div>
      </div>
    </main>
  )
}
