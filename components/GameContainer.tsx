'use client'

import IconItem from '@/components/IconItem'
import ItemEntity from '@/components/ItemEntity'
import { useMountedState } from '@/hooks/useMountedState'
import { Language, type Entities } from '@/models'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadMod, type DatasetPayload } from '@/store/modules/datasetsSlice'
import { SET_LANGUAGE } from '@/store/modules/preferencesSlice'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  SET_RESEARCHED_TECHNOLOGIES,
  getAvailableRecipes,
} from '@/store/modules/settingsSlice'
import { Card, CardBody, Tab, Tabs } from '@nextui-org/react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'

const GameContainer = ({ modData }: { modData: DatasetPayload }) => {
  const dispatch = useAppDispatch()
  const mounted = useMountedState()
  const t = useTranslations()

  const adjustedDataset = useAppSelector(getAdjustedDataset)
  const availableRecipes = useAppSelector(getAvailableRecipes)

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

  useEffect(() => {
    dispatch(SET_LANGUAGE(Language.Chinese))
    dispatch(loadMod(modData))
    dispatch(SET_RESEARCHED_TECHNOLOGIES([]))
  }, [dispatch, modData])

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
