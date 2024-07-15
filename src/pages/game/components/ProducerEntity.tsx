import { rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAdjustedRecipeById,
  getItemEntityById,
  getMachineEntityById,
  getRecipeEntityById,
} from '@/store/modules/recipesSlice';
import {
  addItemStock,
  addProducerToItem,
  getItemRecordById,
  getRecordEntities,
  subItemStock,
  subProducerFromItem,
} from '@/store/modules/recordsSlice';
import { Icon } from '@iconify/react';
import { IconButton, Stack } from '@mui/material';
import { useWhyDidYouUpdate } from 'ahooks';
import { useMemo } from 'react';
import IconItem from './IconItem';

interface ProducerEntityProps {
  id: string;
  itemId: string;
}

const ProducerEntity = ({ id, itemId }: ProducerEntityProps) => {
  const dispatch = useAppDispatch();
  const itemRecord = useAppSelector(getItemRecordById(itemId));
  const records = useAppSelector(getRecordEntities);
  const itemEntity = useAppSelector(getItemEntityById(itemId));
  const adjustedRecipe = useAppSelector(getAdjustedRecipeById(itemId));
  const recipeEntity = useAppSelector(getRecipeEntityById(itemId));

  const machineEntity = useAppSelector(getMachineEntityById(id));

  const producer = useMemo(() => itemRecord?.producers?.[id], [itemRecord, id]);
  const producerAmount = useMemo(
    () => producer?.amount?.toNumber() ?? 0,
    [producer]
  );

  const isWorking = useMemo(() => {
    // const {amount,in,} = producer||{}
    return false;
  }, []);

  useWhyDidYouUpdate('ProducerEntity', {
    id,
    itemId,
    itemRecord,
    records,
    itemEntity,
    adjustedRecipe,
    producer,
    producerAmount,
    machineEntity,
    recipeEntity,
  });

  return (
    <div className="flex items-center">
      <div>
        <IconItem name={id} />
      </div>

      <div className="flex items-center pl-2 text-xl">
        <IconButton
          className="!p-0"
          disabled={!producerAmount}
          onClick={() => {
            dispatch(addItemStock({ id, amount: rational(1) }));
            dispatch(
              subProducerFromItem({
                itemId,
                producerId: id,
                amount: rational(1),
              })
            );
          }}
        >
          <Icon icon="streamline:subtract-circle-solid" />
        </IconButton>
        <span className="px-2">{producerAmount}</span>
        <IconButton
          className="!p-0"
          disabled={!records[id] || records[id].stock.lte(rational(0))}
          onClick={() => {
            dispatch(subItemStock({ id, amount: rational(1) }));
            dispatch(
              addProducerToItem({
                itemId,
                producerId: id,
                amount: rational(1),
              })
            );
          }}
        >
          <Icon icon="streamline:add-circle-solid" />
        </IconButton>
      </div>

      <Stack direction="row" spacing={1} alignItems="center" className="pl-2">
        {adjustedRecipe?.in &&
          Object.keys(adjustedRecipe.in).map((e) => (
            <div key={e} className="flex items-center">
              <IconItem name={e}>
                <div>{adjustedRecipe.in[e].toNumber()}</div>
              </IconItem>
            </div>
          ))}
        <Icon icon="material-symbols:arrow-right-alt" className="text-3xl" />
        {adjustedRecipe?.out &&
          Object.keys(adjustedRecipe.out).map((e) => (
            <div key={e} className="flex items-center">
              <IconItem name={e}>
                <div>{adjustedRecipe.out[e].toNumber()}</div>
              </IconItem>
            </div>
          ))}
        <div>{adjustedRecipe?.time.toNumber()}s</div>
      </Stack>
    </div>
  );
};

export default ProducerEntity;
