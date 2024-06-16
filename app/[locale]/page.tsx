import GameContainer from '@/components/GameContainer'
import TechnologyPanel from '@/components/TechnologyPanel'
import type { ModData, ModHash, ModI18n } from '@/models'
import { promises as fs } from 'fs'
import { unstable_setRequestLocale } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

export default async function IndexPage({ params: { locale } }: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale)

  const dataJSON = await fs.readFile(process.cwd() + '/data/data.json', 'utf8')
  const hashJSON = await fs.readFile(process.cwd() + '/data/hash.json', 'utf8')
  const i18nJSON = await fs.readFile(
    process.cwd() + `/data/i18n/${locale}.json`,
    'utf8',
  )

  const modData = {
    data: { id: '1.1', value: JSON.parse(dataJSON) as ModData },
    hash: { id: '1.1', value: JSON.parse(hashJSON) as ModHash },
    i18n: { id: '1.1-zh', value: JSON.parse(i18nJSON) as ModI18n },
  }

  return (
    <main>
      <div className="flex justify-center py-10">
        <div className="w-full max-w-7xl px-6">
          <GameContainer modData={modData} />
          <TechnologyPanel />
        </div>
      </div>
    </main>
  )
}
