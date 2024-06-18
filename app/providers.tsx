'use client'
import { Rational, type Language } from '@/models'
import { loadMod, type DatasetPayload } from '@/store/modules/datasetsSlice'
import { SET_LANGUAGE } from '@/store/modules/preferencesSlice'
import { SET_RESEARCHED_TECHNOLOGIES } from '@/store/modules/settingsSlice'
import storage from '@/store/storage'
import { makeStore, type AppStore } from '@/store/store'
import { NextUIProvider } from '@nextui-org/react'
import { useRef } from 'react'
import { Provider as StoreProvider } from 'react-redux'

export default function Providers({
  children,
  dataset,
  locale,
}: {
  children: React.ReactNode
  dataset: DatasetPayload
  locale: string
}) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    // Create the store instance the first time this renders

    const savedData = storage.load()

    savedData?.records &&
      Object.keys(savedData.records).forEach((key) => {
        const v = savedData.records[key].stock as never as string
        savedData.records[key].stock = new Rational(BigInt(v) || 0n)
      })

    storeRef.current = makeStore(savedData)

    storeRef.current.dispatch(loadMod(dataset))
    storeRef.current.dispatch(SET_LANGUAGE(locale as Language))
    storeRef.current.dispatch(SET_RESEARCHED_TECHNOLOGIES([]))
  }

  return (
    <NextUIProvider>
      <StoreProvider store={storeRef.current}>{children}</StoreProvider>
    </NextUIProvider>
  )
}
