import { useAppSelector } from '@/store/hooks';
import {
  getAdjustedDataset,
  getRecipeEntities,
} from '@/store/modules/recipesSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import { Icon } from '@iconify/react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import { useWhyDidYouUpdate } from 'ahooks';
import { useMemo } from 'react';
import IconItem from './IconItem';

const ElectricPanel = () => {
  const recipeEntities = useAppSelector(getRecipeEntities);
  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const availableRecipes = useAppSelector(getAvailableRecipes);

  const generatorIds = useMemo(
    () =>
      Object.keys(adjustedDataset.generatorEntities).filter((e) =>
        availableRecipes.includes(e)
      ),
    [adjustedDataset.generatorEntities, availableRecipes]
  );

  // const generates = useMemo(()=>Object.keys(adjustedDataset.adjustedRecipe).filter(e=>adjustedDataset.adjustedRecipe[e]))

  useWhyDidYouUpdate('ElectricPanel', { recipeEntities, adjustedDataset });

  return (
    <Card>
      <CardContent>
        {void console.log('ElectricPanel update')}
        <div>Electric:</div>
        <div>
          {generatorIds.map((id) => (
            <div key={id}>
              <div className="flex items-center pl-2 text-xl">
                <IconButton className="!p-0">
                  <Icon icon="streamline:subtract-circle-solid" />
                </IconButton>
                <div className="px-2">
                  <IconItem name={id}></IconItem>
                </div>
                <IconButton className="!p-0">
                  <Icon icon="streamline:add-circle-solid" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectricPanel;
