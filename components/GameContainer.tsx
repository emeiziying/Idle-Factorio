'use client'

import IconItem from '@/components/IconItem'
import ItemEntity from '@/components/ItemEntity'
import { useMountedState } from '@/hooks/useMountedState'
import { type Entities } from '@/models'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getItemsState } from '@/store/modules/itemsSlice'
import { getMachinesState } from '@/store/modules/machinesSlice'
import {
  getAdjustedDataset,
  getRecipesState,
} from '@/store/modules/recipesSlice'
import { getAvailableRecipes } from '@/store/modules/settingsSlice'
import { Card, CardBody, Tab, Tabs } from '@nextui-org/react'
import { useWhyDidYouUpdate } from 'ahooks'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const GameContainer = () => {
  const dispatch = useAppDispatch()
  const mounted = useMountedState()
  const t = useTranslations()

  const adjustedDataset = useAppSelector(getAdjustedDataset)
  const availableRecipes = useAppSelector(getAvailableRecipes)

  const itemsState = useAppSelector(getItemsState)
  const machinesState = useAppSelector(getMachinesState)
  const recipesState = useAppSelector(getRecipesState)

  const categoryRows = useMemo(() => {
    const allIdsSet = new Set(availableRecipes)
    const rows: Entities<string[][]> = {}

    adjustedDataset.categoryIds.forEach((c) => {
      if (adjustedDataset.categoryItemRows[c]) {
        rows[c] = []
        adjustedDataset.categoryItemRows[c].forEach((r) => {
          const row = r.filter((i) => allIdsSet.has(i))
          if (row.length) rows[c].push(row)
        })
      }
    })
    return rows
  }, [adjustedDataset, availableRecipes])

  const categoryIds = useMemo(
    () => adjustedDataset.categoryIds.filter((c) => categoryRows[c]?.length),
    [adjustedDataset, categoryRows],
  )

  const categoryEntities = useMemo(
    () => adjustedDataset.categoryEntities,
    [adjustedDataset],
  )

  useWhyDidYouUpdate('GameContainer', {
    itemsState,
    machinesState,
    recipesState,
  })

  if (!mounted) return null

  return (
    <div>
      <Tabs aria-label="Options">
        {categoryIds.map((categoryId) => (
          <Tab
            key={categoryId}
            title={
              <div className="flex items-center">
                <IconItem name={categoryId} />
                {categoryEntities[categoryId].name}
              </div>
            }
            className="py-2 px-0"
          >
            <Card>
              <CardBody>
                <div>
                  {categoryRows[categoryId].map((ids, index) => (
                    <div key={index} className="flex flex-wrap ">
                      {ids.map((id) => (
                        <ItemEntity key={id} id={id} />
                      ))}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export default GameContainer
