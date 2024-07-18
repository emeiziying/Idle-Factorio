import { ObjectiveUnit, type Entities } from '@/models';
import ItemEntity from '@/pages/game/components/ItemEntity';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  gameState,
  SET_CURRENT_CATEGORY,
  SET_CURRENT_ITEM,
} from '@/store/modules/gameSlice';
import { getItemsState } from '@/store/modules/itemsSlice';
import { getMachinesState } from '@/store/modules/machinesSlice';
import { addObjective, getSteps } from '@/store/modules/objectivesSlice';
import {
  getAdjustedDataset,
  getRecipesState,
  SET_MACHINE,
} from '@/store/modules/recipesSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Card, Stack } from '@mui/material';
import Tab from '@mui/material/Tab';
import { useWhyDidYouUpdate } from 'ahooks';
import { useEffect, useMemo } from 'react';
import ElectricityPanel from './ElectricityPanel';
import IconItem from './IconItem';
import ItemConfig from './ItemConfig';
import Settings from './Settings';

const GameContainer = () => {
  const dispatch = useAppDispatch();

  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const availableRecipes = useAppSelector(getAvailableRecipes);
  const itemsState = useAppSelector(getItemsState);
  const machinesState = useAppSelector(getMachinesState);
  const recipesState = useAppSelector(getRecipesState);
  const game = useAppSelector(gameState);
  const steps = useAppSelector(getSteps);

  const categoryRows = useMemo(() => {
    const allIdsSet = new Set(availableRecipes);
    const rows: Entities<string[][]> = {};

    adjustedDataset.categoryIds.forEach((c) => {
      if (adjustedDataset.categoryItemRows[c]) {
        rows[c] = [];
        adjustedDataset.categoryItemRows[c].forEach((r) => {
          const row = r.filter((i) => allIdsSet.has(i));
          if (row.length) rows[c].push(row);
        });
      }
    });
    return rows;
  }, [adjustedDataset, availableRecipes]);

  const categoryIds = useMemo(
    () => adjustedDataset.categoryIds.filter((c) => categoryRows[c]?.length),
    [adjustedDataset, categoryRows]
  );

  const categoryEntities = useMemo(
    () => adjustedDataset.categoryEntities,
    [adjustedDataset]
  );

  useEffect(() => {
    dispatch(
      SET_MACHINE({ recipeId: 'iron-ore', machineId: 'electric-mining-drill' })
    );
    dispatch(addObjective({ targetId: 'iron-ore', unit: ObjectiveUnit.Items }));
  }, [dispatch]);

  useWhyDidYouUpdate('GameContainer', {
    itemsState,
    machinesState,
    recipesState,
    adjustedDataset,
    availableRecipes,
    steps,
  });

  return (
    <>
      <Settings />

      <ElectricityPanel />

      <Stack spacing={2} direction="row">
        <Box flex={1}>
          <Card className="h-full">
            <TabContext value={game.currentCategory}>
              <TabList
                aria-label="Options"
                onChange={(_, v: string) => dispatch(SET_CURRENT_CATEGORY(v))}
              >
                {categoryIds.map((categoryId, index) => (
                  <Tab
                    key={categoryId}
                    label={
                      <div className="flex items-center">
                        <IconItem name={categoryId} />
                        {categoryEntities[categoryId].name}
                      </div>
                    }
                    value={`${index}`}
                    className="px-0 py-2"
                  />
                ))}
              </TabList>

              {categoryIds.map((categoryId, index) => (
                <TabPanel
                  key={categoryId}
                  value={`${index}`}
                  className="px-0 py-2"
                >
                  <div>
                    {categoryRows[categoryId].map((ids, index) => (
                      <div key={index} className="flex flex-wrap">
                        {ids.map((id) => (
                          <ItemEntity
                            key={id}
                            id={id}
                            onClick={() => {
                              dispatch(SET_CURRENT_ITEM(id));
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </TabPanel>
              ))}
            </TabContext>
          </Card>
        </Box>
        <Box flex={1}>
          <ItemConfig itemId={game.currentItemId} />
        </Box>
      </Stack>
    </>
  );
};

export default GameContainer;
