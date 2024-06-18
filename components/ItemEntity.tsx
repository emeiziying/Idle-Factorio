import IconItem from '@/components/IconItem'
import { Rational } from '@/models'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  addItemStock,
  recordsState,
  subItemStock,
  type ItemRecord,
} from '@/store/modules/recordsSlice'
import { Button, Tooltip } from '@nextui-org/react'
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

  const canMake = useMemo(
    () =>
      Object.keys(recipeEntity.in).every(
        (id) =>
          records[id]?.stock && records[id].stock.gte(recipeEntity.in[id]),
      ),
    [recipeEntity, records],
  )

  const handleManualMake = () => {
    dispatch(addItemStock({ id, stock: new Rational(1n) }))
    Object.keys(recipeEntity.in).forEach((inId) => {
      dispatch(subItemStock({ id: inId, stock: recipeEntity.in[inId] }))
    })
  }

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
          {itemEntity.name}
          <div>time:{recipeEntity.time.toNumber()}</div>
          <div>stock:{itemRecord?.stock.toNumber() || 0}</div>
          <Button isDisabled={!canMake} onClick={handleManualMake} size="sm">
            Make
          </Button>
        </div>
      </div>
    </Tooltip>
  )
}

export default ItemEntity
