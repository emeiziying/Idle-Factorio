'use client'
import packageInfo from '@/package.json'
import type { RootState } from '@/store/store'

const key = `saved_v${packageInfo.version}`

const storage = {
  save: (data: RootState) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data))
      console.log('save', data)
    }
  },
  load: (defaultData?: Partial<RootState>): RootState | undefined => {
    if (typeof localStorage !== 'undefined') {
      const data = JSON.parse(localStorage.getItem(key) || 'null')
      if (!data) return undefined
      return Object.assign({}, data, defaultData)
    }
    return undefined
  },
}

export default storage
