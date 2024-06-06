'use client'

import IconItem from '@/components/IconItem'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  UNLOCK_TECHNOLOGY,
  getResearchedTechnologyIds,
} from '@/store/modules/settingsSlice'
import { Card, CardBody } from '@nextui-org/react'
import { useWhyDidYouUpdate } from 'ahooks'
import { useMemo } from 'react'

const TechnologyPanel = () => {
  const dispatch = useAppDispatch()

  const researchedTechnologyIds = useAppSelector(getResearchedTechnologyIds)
  const adjustedDataset = useAppSelector(getAdjustedDataset)

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

  useWhyDidYouUpdate('TechnologyPanel', { technology, itemEntities, tabs })

  return (
    <Card>
      <CardBody>
        {tabs.map((key) => (
          <div key={key}>
            <div>{key}</div>
            <div className="flex flex-wrap">
              {technology[key].map((id) => (
                <div
                  key={id}
                  className="p-2"
                  onClick={() =>
                    key === 'available' && dispatch(UNLOCK_TECHNOLOGY(id))
                  }
                >
                  <IconItem
                    name={itemEntities[id].icon || id}
                    text={itemEntities[id].iconText}
                  />
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
