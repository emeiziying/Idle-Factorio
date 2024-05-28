import data from '@/data/data.json'
import { useMemo } from 'react'

type Props = {
  name: string
}

const IconItem = (props: Props) => {
  const { name } = props
  const style = useMemo(() => {
    const item = data.icons.find((e) => e.id === name)
    if (!item) return
    return {
      backgroundPosition: item.position,
    }
  }, [name])
  return (
    <div className="w-8 h-8">
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

      {name}
    </div>
  )
}

export default IconItem
