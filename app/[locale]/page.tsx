import GameContainer from '@/components/GameContainer'
import TechnologyPanel from '@/components/TechnologyPanel'
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations()

  return (
    <main>
      {t('app.data')}
      <div className="flex justify-center py-10">
        <div className="w-full max-w-7xl px-6">
          <GameContainer />
          <TechnologyPanel />
        </div>
      </div>
    </main>
  )
}
