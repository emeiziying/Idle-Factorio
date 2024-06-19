'use client'

import IconItem from '@/components/IconItem'
import { useMountedState } from '@/hooks/useMountedState'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getAdjustedDataset } from '@/store/modules/recipesSlice'
import {
  UNLOCK_TECHNOLOGY,
  getResearchedTechnologyIds,
  getTechnologyState,
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
  const technologyState = useAppSelector(getTechnologyState)

  const technologyEntities = useMemo(
    () => adjustedDataset.technologyEntities,
    [adjustedDataset],
  )

  const recipeEntities = useMemo(
    () => adjustedDataset.recipeEntities,
    [adjustedDataset],
  )

  const itemEntities = useMemo(
    () => adjustedDataset.itemEntities,
    [adjustedDataset],
  )

  const tabs = useMemo(
    () => Object.keys(technologyState) as (keyof typeof technologyState)[],
    [technologyState],
  )

  useWhyDidYouUpdate('TechnologyPanel', {
    technologyState,
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
              {technologyState[key].map((id) => (
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
