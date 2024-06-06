import data from '@/data/data.json'
import { useMemo } from 'react'

type Props = {
  name: string
  text?: string
  size?: number | string
}

const IconItem = (props: Props) => {
  const { name, text, size = 32 } = props

  const style = useMemo(() => {
    const item = data.icons.find((e) => e.id === name)
    if (!item) return
    return { backgroundPosition: item.position }
  }, [name])

  const scale = useMemo(() => Number(size) / 64, [size])

  return (
    <div
      className="relative"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          background: 'url(/icons.webp)',
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          ...style,
        }}
      />
      {text && (
        <div
          className="absolute right-0 top-0 text-[#ffffff] font-bold line-height leading-4	text-4"
          style={{
            textShadow:
              '0px 2px 2px black, 0px -2px 2px black, 2px 0px 2px black, -2px 0px 2px black',
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}

export default IconItem
