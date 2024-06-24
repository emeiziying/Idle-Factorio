import IconItem from '@/components/IconItem';
import ItemEntity from '@/components/ItemEntity';
import { type Entities } from '@/models';
import { useAppSelector } from '@/store/hooks';
import { getItemsState } from '@/store/modules/itemsSlice';
import { getMachinesState } from '@/store/modules/machinesSlice';
import {
  getAdjustedDataset,
  getRecipesState,
} from '@/store/modules/recipesSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tab from '@mui/material/Tab';
import { useWhyDidYouUpdate } from 'ahooks';

import { useMemo, useState } from 'react';

const GameContainer = () => {
  const [value, setValue] = useState('0');

  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const availableRecipes = useAppSelector(getAvailableRecipes);

  const itemsState = useAppSelector(getItemsState);
  const machinesState = useAppSelector(getMachinesState);
  const recipesState = useAppSelector(getRecipesState);

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

  useWhyDidYouUpdate('GameContainer', {
    itemsState,
    machinesState,
    recipesState,
    adjustedDataset,
    availableRecipes,
  });

  return (
    <Box sx={{ width: '100%', background: 'white' }}>
      <TabContext value={value}>
        <TabList aria-label="Options" onChange={(_, v: string) => setValue(v)}>
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
              className="py-2 px-0"
            />
          ))}
        </TabList>

        {categoryIds.map((categoryId, index) => (
          <TabPanel key={categoryId} value={`${index}`} className="py-2 px-0">
            <Card sx={{ minWidth: 800 }}>
              <CardContent>
                <div>
                  {categoryRows[categoryId].map((ids, index) => (
                    <div key={index} className="flex flex-wrap ">
                      {ids.map((id) => (
                        <ItemEntity key={id} id={id} />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
};

export default GameContainer;
