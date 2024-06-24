import CraftingButton from '@/components/CraftingButton'
import IconItem from '@/components/IconItem'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import { recordsState, type ItemRecord } from '@/store/modules/recordsSlice'
import { Tooltip } from '@nextui-org/react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

type Props = {
  id: string
}

const ItemEntity = ({ id }: Props) => {
  const t = useTranslations()
  const dispatch = useAppDispatch()
  const adjustedDataset = useAppSelector(getAdjustedDataset)
  const records = useAppSelector(recordsState)

  const itemEntity = useMemo(
    () => adjustedDataset.itemEntities[id],
    [adjustedDataset, id],
  )

  const recipeEntity = useMemo(
    () => adjustedDataset.recipeEntities[id],
    [adjustedDataset, id],
  )

  const itemRecord = useMemo<ItemRecord | undefined>(
    () => records[id],
    [records, id],
  )

  const canManualCrafting = useMemo(() => {
    return recipeEntity.category !== 'smelting'
  }, [recipeEntity])

  return (
    <Tooltip
      isDisabled={true}
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
        <div>
          {itemEntity.name}-{itemEntity.id}
          <div>time:{recipeEntity.time.toNumber()}</div>
          <div>stock:{itemRecord?.stock.toNumber() || 0}</div>
          {canManualCrafting && <CraftingButton id={id} />}
        </div>
      </div>
    </Tooltip>
  )
}

export default ItemEntity
