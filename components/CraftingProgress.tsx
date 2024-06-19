import { forwardRef, useImperativeHandle } from 'react'

type Props = {
  duration: number
  onFinish: () => void
}

export type CraftingProgressHandle = {
  start: () => void
}

const CraftingProgress = forwardRef<CraftingProgressHandle, Props>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({
      start: () => {
        console.log('start')
      },
    }))

    return (
      <div className="w-full bg-white">
        <div className="h-1 transition-width w-0 bg-slate-300" />
      </div>
    )
  },
)

CraftingProgress.displayName = 'CraftingProgress'

export default CraftingProgress
