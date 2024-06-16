'use client'

import IconItem from '@/components/IconItem'
import ItemEntity from '@/components/ItemEntity'
import { useMountedState } from '@/hooks/useMountedState'
import { Language, type Entities } from '@/models'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  getDataRecord,
  loadMod,
  type DatasetPayload,
} from '@/store/modules/datasetsSlice'
import { SET_LANGUAGE } from '@/store/modules/preferencesSlice'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  SET_RESEARCHED_TECHNOLOGIES,
  getAvailableRecipes,
  getResearchedTechnologyIds,
} from '@/store/modules/settingsSlice'
import { Card, CardBody, Tab, Tabs } from '@nextui-org/react'
import { useWhyDidYouUpdate } from 'ahooks'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'

const GameContainer = ({ modData }: { modData: DatasetPayload }) => {
  const dispatch = useAppDispatch()
  const mounted = useMountedState()
  const t = useTranslations()

  const dataRecord = useAppSelector(getDataRecord)
  const adjustedDataset = useAppSelector(getAdjustedDataset)
  const availableRecipes = useAppSelector(getAvailableRecipes)
  const researchedTechnologyIds = useAppSelector(getResearchedTechnologyIds)

  const technology = useMemo(() => {
    let selection: string[] = researchedTechnologyIds || []
    const set = new Set(selection)
    const available: string[] = []
    const locked: string[] = []

    let technologyIds = adjustedDataset.technologyIds

    const researched = selection

    for (const id of technologyIds) {
      if (!set.has(id)) {
        const tech = adjustedDataset.technologyEntities[id]

        if (
          tech.prerequisites == null ||
          tech.prerequisites.every((p) => set.has(p))
        ) {
          available.push(id)
        } else {
          locked.push(id)
        }
      }
    }

    return { available, locked, researched }
  }, [adjustedDataset, researchedTechnologyIds])

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

  useWhyDidYouUpdate('Home', [
    dataRecord,
    adjustedDataset,
    technology,
    availableRecipes,
    categoryIds,
    categoryRows,
    researchedTechnologyIds,
  ])

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
