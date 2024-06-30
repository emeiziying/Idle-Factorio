import { type Entities } from '@/models';
import ItemEntity from '@/pages/game/components/ItemEntity';
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
import { Card } from '@mui/material';
import Tab from '@mui/material/Tab';
import { useWhyDidYouUpdate } from 'ahooks';
import IconItem from './IconItem';

import { useMemo, useState } from 'react';
import ItemConfigDialog from './ItemConfigDialog';

const GameContainer = () => {
  const [currentTab, setCurrentTab] = useState('0');
  const [currentItem, setCurrentItem] = useState('iron-plate');
  const [configDialogVisible, setConfigDialogVisible] = useState(true);

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
    <>
      <Card sx={{ mb: 2 }}>
        <TabContext value={currentTab}>
          <TabList
            aria-label="Options"
            onChange={(_, v: string) => setCurrentTab(v)}
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
            <TabPanel key={categoryId} value={`${index}`} className="px-0 py-2">
              <div>
                {categoryRows[categoryId].map((ids, index) => (
                  <div key={index} className="flex flex-wrap">
                    {ids.map((id) => (
                      <ItemEntity
                        key={id}
                        id={id}
                        onClick={() => {
                          setCurrentItem(id);
                          setConfigDialogVisible(true);
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

      <ItemConfigDialog
        itemId={currentItem}
        open={configDialogVisible}
        onClose={() => setConfigDialogVisible(false)}
      />
    </>
  );
};

export default GameContainer;