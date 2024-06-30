import { useMountedState } from '@/hooks/useMountedState';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getItemEntities,
  getRecipeEntities,
} from '@/store/modules/recipesSlice';
import {
  UNLOCK_TECHNOLOGY,
  getTechnologyState,
} from '@/store/modules/settingsSlice';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import IconItem from './IconItem';

const TechnologyPanel = () => {
  const mounted = useMountedState();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const technologyState = useAppSelector(getTechnologyState);
  const recipeEntities = useAppSelector(getRecipeEntities);
  const itemEntities = useAppSelector(getItemEntities);

  const tabs = useMemo(
    () => Object.keys(technologyState) as (keyof typeof technologyState)[],
    [technologyState]
  );

  if (!mounted) return null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {tabs.map((key) => (
          <div key={key}>
            <div>{t(`techPicker.${key}`)}</div>
            <div className="flex flex-wrap">
              {technologyState[key].map((id) => (
                <div
                  key={id}
                  className={clsx('flex w-20 flex-col items-center p-2', {
                    'opacity-50': key !== 'available',
                  })}
                  onClick={() =>
                    key === 'available' && dispatch(UNLOCK_TECHNOLOGY(id))
                  }
                >
                  <IconItem
                    name={itemEntities[id].icon ?? id}
                    text={itemEntities[id].iconText}
                    size="32"
                  />

                  <div className="flex items-center pt-1">
                    {Object.keys(recipeEntities[id].in).map((inId) => (
                      <IconItem key={inId} name={inId} size="12" />
                    ))}
                    {recipeEntities[id].count && (
                      <span className="pl-1 text-[8px]">
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
