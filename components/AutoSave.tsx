'use client'
import { useAppSelector } from '@/store/hooks'
import { recordsState } from '@/store/modules/recordsSlice'
import storage from '@/store/storage'
import { useRafInterval } from 'ahooks'
import { useState } from 'react'

const AutoSave = () => {
  const [saving, setSaving] = useState(false)
  const [seconds, setSeconds] = useState(10)

  const records = useAppSelector(recordsState)

  useRafInterval(() => {
    const s = seconds - 1
    if (s <= 0) {
      setSaving(true)
      storage.save({ records })

      setTimeout(() => {
        setSaving(false)
        setSeconds(10)
      }, 1000)
    } else {
      setSeconds(s)
    }
  }, 1000)

  return (
    <div className="px-5">
      {saving ? '自动保存中...' : `${seconds}秒后自动保存`}
    </div>
  )
}

export default AutoSave
