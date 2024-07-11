import { Rational } from '@/models';
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
import { IconButton } from '@mui/material';
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

      <div className="flex items-center pl-3 text-xl">
        <IconButton
          className="!p-0"
          disabled={!producerAmount}
          onClick={() => {
            dispatch(addItemStock({ id, amount: new Rational(1n) }));
            dispatch(
              subProducerFromItem({
                itemId,
                producerId: id,
                amount: new Rational(1n),
              })
            );
          }}
        >
          <Icon icon="streamline:subtract-circle-solid" />
        </IconButton>
        <span className="px-2">{producerAmount}</span>
        <IconButton
          className="!p-0"
          disabled={!records[id] || records[id].stock.lte(new Rational(0n))}
          onClick={() => {
            dispatch(subItemStock({ id, amount: new Rational(1n) }));
            dispatch(
              addProducerToItem({
                itemId,
                producerId: id,
                amount: new Rational(1n),
              })
            );
          }}
        >
          <Icon icon="streamline:add-circle-solid" />
        </IconButton>
      </div>

      <div>
        <div className="flex items-center">
          <div>In:</div>
          {adjustedRecipe?.in &&
            Object.keys(adjustedRecipe.in).map((e) => (
              <div key={e} className="flex items-center">
                <IconItem name={e} />
                <div>{adjustedRecipe.in[e].toNumber()}</div>
              </div>
            ))}
        </div>

        <div className="flex items-center">
          <div>Out:</div>
          {adjustedRecipe?.out &&
            Object.keys(adjustedRecipe.out).map((e) => (
              <div key={e} className="flex items-center">
                <IconItem name={e} />
                <div>{adjustedRecipe.out[e].toNumber()}</div>
              </div>
            ))}
        </div>

        <div>Time: {adjustedRecipe?.time.toNumber()}</div>

        <div className="flex items-center">
          <div>Output/s:</div>
          {adjustedRecipe?.output &&
            Object.keys(adjustedRecipe.output).map((e) => (
              <div key={e} className="flex items-center">
                <IconItem name={e} />
                <div>{adjustedRecipe.output[e].toNumber()}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProducerEntity;
