import CraftingProgress, {
  type CraftingProgressHandle,
} from '@/components/CraftingProgress'
import { Rational } from '@/models'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  addItemStock,
  recordsState,
  subItemStock,
} from '@/store/modules/recordsSlice'
import { Button } from '@nextui-org/react'
import { useMemo, useRef } from 'react'

type Props = {
  id: string
}

const CraftingButton = ({ id }: Props) => {
  const adjustedDataset = useAppSelector(getAdjustedDataset)
  const records = useAppSelector(recordsState)
  const dispatch = useAppDispatch()

  const craftingProgress = useRef<CraftingProgressHandle>(null)

  const recipeEntity = useMemo(
    () => adjustedDataset.recipeEntities[id],
    [adjustedDataset, id],
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
    <Button
      isDisabled={!canMake}
      onClick={() => {
        craftingProgress.current?.start()
      }}
      size="sm"
    >
      <div>
        Make
        <CraftingProgress
          ref={craftingProgress}
          duration={recipeEntity.cost?.toNumber() || 0}
          onFinish={() => {}}
        />
      </div>
    </Button>
  )
}

export default CraftingButton
