import data from '@/data/data.json'
import { useMemo } from 'react'

type Props = {
  name: string
  text?: string
}

const IconItem = (props: Props) => {
  const { name, text } = props

  const style = useMemo(() => {
    const item = data.icons.find((e) => e.id === name)
    if (!item) return
    return { backgroundPosition: item.position }
  }, [name])

  return (
    <div className="w-8 h-8 relative">
      <div
        style={{
          width: 64,
          height: 64,
          background: `url(/icons.webp)`,
          transform: 'scale(.5)',
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
