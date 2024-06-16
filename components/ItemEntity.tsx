import IconItem from '@/components/IconItem'
import { useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import { Tooltip } from '@nextui-org/react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

type Props = {
  id: string
}

const ItemEntity = ({ id }: Props) => {
  const t = useTranslations()
  const adjustedDataset = useAppSelector(getAdjustedDataset)

  const itemEntity = useMemo(
    () => adjustedDataset.itemEntities[id],
    [adjustedDataset, id],
  )

  const recipeEntity = useMemo(
    () => adjustedDataset.recipeEntities[id],
    [adjustedDataset, id],
  )

  return (
    <Tooltip
      content={
        <div className="text-black">
          <div className="flex items-center">
            <div>time:{recipeEntity.time.toNumber()}</div>
            <div className="flex">
              {Object.keys(recipeEntity.in).map((id) => (
                <IconItem key={id} name={id}>
                  {recipeEntity.in[id].toNumber()}
                </IconItem>
              ))}
            </div>
            {'->'}
            <div className="flex">
              {Object.keys(recipeEntity.out).map((id) => (
                <IconItem key={id} name={id}>
                  {recipeEntity.out[id].toNumber()}
                </IconItem>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="pr-1">{t('data.producers')}:</div>
            {recipeEntity.producers.map((id) => (
              <IconItem key={id} name={id} />
            ))}
          </div>
        </div>
      }
    >
      <div className="p-1">
        <IconItem name={itemEntity.icon || id} text={itemEntity.iconText} />
      </div>
    </Tooltip>
  )
}

export default ItemEntity
