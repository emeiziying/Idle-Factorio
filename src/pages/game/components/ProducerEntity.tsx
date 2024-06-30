import { Rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAdjustedRecipeById,
  getItemEntityById,
} from '@/store/modules/recipesSlice';
import {
  addItemStock,
  addProducerToItem,
  getItemRecordById,
  recordsState,
  subItemStock,
  subProducerToItem,
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
  const records = useAppSelector(recordsState);
  const itemEntity = useAppSelector(getItemEntityById(itemId));
  const adjustedRecipe = useAppSelector(getAdjustedRecipeById(itemId));

  const producer = useMemo(() => itemRecord?.producers?.[id], [itemRecord, id]);
  const producerAmount = useMemo(() => producer?.toNumber() ?? 0, [producer]);

  useWhyDidYouUpdate('ProducerEntity', {
    id,
    itemId,
    itemRecord,
    records,
    itemEntity,
    adjustedRecipe,
    producer,
    producerAmount,
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
            dispatch(addItemStock({ id, stock: new Rational(1n) }));
            dispatch(
              subProducerToItem({
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
            dispatch(subItemStock({ id, stock: new Rational(1n) }));
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

      {/* <div></div> */}
    </div>
  );
};

export default ProducerEntity;
