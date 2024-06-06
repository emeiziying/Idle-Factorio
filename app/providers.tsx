'use client'
import { makeStore, type AppStore } from '@/store/store'
import { NextUIProvider } from '@nextui-org/react'
import { useRef } from 'react'
import { Provider as StoreProvider } from 'react-redux'

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  return (
    <NextUIProvider>
      <StoreProvider store={storeRef.current}>{children}</StoreProvider>
    </NextUIProvider>
  )
}
