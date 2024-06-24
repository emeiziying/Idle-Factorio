import IconItem from '@/components/IconItem';
import { useMountedState } from '@/hooks/useMountedState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getAdjustedDataset } from '@/store/modules/recipesSlice';
import {
  UNLOCK_TECHNOLOGY,
  getResearchedTechnologyIds,
  getTechnologyState,
} from '@/store/modules/settingsSlice';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useWhyDidYouUpdate } from 'ahooks';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const TechnologyPanel = () => {
  const mounted = useMountedState();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const researchedTechnologyIds = useAppSelector(getResearchedTechnologyIds);
  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const technologyState = useAppSelector(getTechnologyState);

  const technologyEntities = useMemo(
    () => adjustedDataset.technologyEntities,
    [adjustedDataset]
  );

  const recipeEntities = useMemo(
    () => adjustedDataset.recipeEntities,
    [adjustedDataset]
  );

  const itemEntities = useMemo(
    () => adjustedDataset.itemEntities,
    [adjustedDataset]
  );

  const tabs = useMemo(
    () => Object.keys(technologyState) as (keyof typeof technologyState)[],
    [technologyState]
  );

  useWhyDidYouUpdate('TechnologyPanel', {
    technologyState,
    technologyEntities,
    itemEntities,
    tabs,
    recipeEntities,
  });

  if (!mounted) return null;

  return (
    <Card>
      <CardContent>
        {tabs.map((key) => (
          <div key={key}>
            <div>{t(`techPicker.${key}`)}</div>
            <div className="flex flex-wrap">
              {technologyState[key].map((id) => (
                <div
                  key={id}
                  className={clsx('p-2 flex flex-col items-center w-20', {
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
      </CardContent>
    </Card>
  );
};

export default TechnologyPanel;
