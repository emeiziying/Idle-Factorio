'use client'

import { useMountedState } from '@/hooks/useMountedState'
import { useEffect } from 'react'

const TestItem = () => {
  const mounted = useMountedState()

  useEffect(() => {
    console.log('TestItem')
  }, [])

  return <div>TestItem</div>
}

export default TestItem
