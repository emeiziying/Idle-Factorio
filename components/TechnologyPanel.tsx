'use client'

import IconItem from '@/components/IconItem'
import { useMountedState } from '@/hooks/useMountedState'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  UNLOCK_TECHNOLOGY,
  getResearchedTechnologyIds,
} from '@/store/modules/settingsSlice'
import { Card, CardBody } from '@nextui-org/react'
import { useWhyDidYouUpdate } from 'ahooks'
import classnames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const TechnologyPanel = () => {
  const mounted = useMountedState()
  const dispatch = useAppDispatch()
  const t = useTranslations()

  const researchedTechnologyIds = useAppSelector(getResearchedTechnologyIds)
  const adjustedDataset = useAppSelector(getAdjustedDataset)

  const technologyEntities = useMemo(
    () => adjustedDataset.technologyEntities,
    [adjustedDataset],
  )

  const recipeEntities = useMemo(
    () => adjustedDataset.recipeEntities,
    [adjustedDataset],
  )

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

  const itemEntities = useMemo(
    () => adjustedDataset.itemEntities,
    [adjustedDataset],
  )

  const tabs = useMemo(
    () => Object.keys(technology) as (keyof typeof technology)[],
    [technology],
  )

  useWhyDidYouUpdate('TechnologyPanel', {
    technology,
    technologyEntities,
    itemEntities,
    tabs,
    recipeEntities,
  })

  if (!mounted) return null

  return (
    <Card>
      <CardBody>
        {tabs.map((key) => (
          <div key={key}>
            <div>{t(`techPicker.${key}`)}</div>
            <div className="flex flex-wrap">
              {technology[key].map((id) => (
                <div
                  key={id}
                  className={classnames('p-2 flex flex-col items-center w-20', {
                    'opacity-50': key !== 'available',
                  })}
                  onClick={() =>
                    key === 'available' && dispatch(UNLOCK_TECHNOLOGY(id))
                  }
                >
                  <IconItem
                    name={itemEntities[id].icon || id}
                    text={itemEntities[id].iconText}
                    size="32"
                  />

                  <div className="flex items-center pt-1">
                    {Object.keys(recipeEntities[id].in).map((inId) => (
                      <IconItem key={inId} name={inId} size="12" />
                    ))}
                    {recipeEntities[id].count && (
                      <span className="text-[8px] pl-1">
                        x{recipeEntities[id].count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

export default TechnologyPanel
