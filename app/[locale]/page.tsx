import GameContainer from '@/components/GameContainer'
import TechnologyPanel from '@/components/TechnologyPanel'
import { unstable_setRequestLocale } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

export default async function IndexPage({ params: { locale } }: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale)

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
