import { rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addElectricStock,
  selectElectricById,
  subElectricStock,
} from '@/store/modules/electricsSlice';
import {
  getAdjustedDataset,
  getRecipeEntities,
} from '@/store/modules/recipesSlice';
import {
  addItemStock,
  selectStockFromRecordById,
  subItemStock,
} from '@/store/modules/recordsSlice';
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
            <GeneratorItem key={id} id={id} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectricPanel;

const GeneratorItem = ({ id }: { id: string }) => {
  const dispatch = useAppDispatch();
  const electric = useAppSelector((state) => selectElectricById(state, id));
  const stock = useAppSelector((state) => selectStockFromRecordById(state, id));

  // const power = useMemo(() => {
  //   const v = rational(200)
  //     .mul(rational(25000))
  //     .mul(rational(165).sub(rational(10)));
  //   return electric.stock.mul(v);
  // }, [electric.stock]);

  return (
    <div>
      <div className="flex items-center pl-2 text-xl">
        <IconButton
          className="!p-0"
          disabled={!electric?.stock.gte(rational(1))}
          onClick={() => {
            dispatch(subElectricStock({ id, amount: rational(1) }));
            dispatch(addItemStock({ id, amount: rational(1) }));
          }}
        >
          <Icon icon="streamline:subtract-circle-solid" />
        </IconButton>
        <div className="px-2">
          <IconItem name={id}>{electric?.stock.toNumber()}</IconItem>
        </div>
        <IconButton
          className="!p-0"
          disabled={!stock?.gte(rational(1))}
          onClick={() => {
            dispatch(addElectricStock({ id, amount: rational(1) }));
            dispatch(subItemStock({ id, amount: rational(1) }));
          }}
        >
          <Icon icon="streamline:add-circle-solid" />
        </IconButton>

        <div></div>
      </div>
    </div>
  );
};
