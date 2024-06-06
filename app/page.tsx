import GameContainer from '@/components/GameContainer'
import TechnologyPanel from '@/components/TechnologyPanel'

export default function Home() {
  console.log('Home update')

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
