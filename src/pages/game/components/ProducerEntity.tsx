import { rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdjustedRecipeByIdWithProducer } from '@/store/modules/recipesSlice';
import {
  addItemStock,
  addProducerToItem,
  selectProducerAmountFromRecordById,
  selectProducerFromRecordById,
  selectStockFromRecordById,
  subItemStock,
  subProducerFromItem,
} from '@/store/modules/recordsSlice';
import { Icon } from '@iconify/react';
import { IconButton, Stack } from '@mui/material';
import { useWhyDidYouUpdate } from 'ahooks';
import { useCallback, useMemo } from 'react';
import IconItem from './IconItem';
import LinearProgress from './LinearProgress';

interface ProducerEntityProps {
  id: string;
  itemId: string;
}

const ProducerEntity = ({ id, itemId }: ProducerEntityProps) => {
  const dispatch = useAppDispatch();
  const stock = useAppSelector((state) => selectStockFromRecordById(state, id));
  const producerAmount = useAppSelector((state) =>
    selectProducerAmountFromRecordById(state, { itemId, machineId: id })
  );
  const adjustedRecipe = useAppSelector((state) =>
    selectAdjustedRecipeByIdWithProducer(state, {
      recipeId: itemId,
      machineId: id,
    })
  );

  const consumption = useMemo(
    () => adjustedRecipe?.consumption?.toNumber() ?? 0,
    [adjustedRecipe]
  );
  const inKeys = useMemo(
    () => Object.keys(adjustedRecipe?.in ?? {}),
    [adjustedRecipe]
  );
  const outKeys = useMemo(
    () => Object.keys(adjustedRecipe?.out ?? {}),
    [adjustedRecipe]
  );

  const handleSub = useCallback(() => {
    dispatch(addItemStock({ id, amount: rational(1) }));
    dispatch(
      subProducerFromItem({
        itemId,
        producerId: id,
        amount: rational(1),
      })
    );
  }, [dispatch, id, itemId]);

  const handleAdd = useCallback(() => {
    dispatch(subItemStock({ id, amount: rational(1) }));
    dispatch(
      addProducerToItem({
        itemId,
        producerId: id,
        amount: rational(1),
      })
    );
  }, [dispatch, id, itemId]);

  useWhyDidYouUpdate(`ProducerEntity id:${id}`, { adjustedRecipe });

  return (
    <div>
      {void console.log('ProducerEntity update', id, itemId)}
      <div className="flex items-center">
        <div className="flex items-center pl-2 text-xl">
          <IconButton
            className="!p-0"
            disabled={!producerAmount}
            onClick={handleSub}
          >
            <Icon icon="streamline:subtract-circle-solid" />
          </IconButton>
          <div className="px-2">
            <IconItem name={id}>{producerAmount?.toNumber()}</IconItem>
          </div>
          <IconButton
            className="!p-0"
            disabled={!stock?.gte(rational(1))}
            onClick={handleAdd}
          >
            <Icon icon="streamline:add-circle-solid" />
          </IconButton>
        </div>

        <Stack direction="row" spacing={1} alignItems="center" className="pl-2">
          {inKeys.map((e) => (
            <div key={e} className="flex items-center">
              <IconItem name={e}>{adjustedRecipe?.in[e].toNumber()}</IconItem>
            </div>
          ))}
          {consumption > 0 && (
            <IconItem name="material-symbols:electric-bolt-rounded">
              {consumption}
            </IconItem>
          )}
          <div className="flex flex-col items-center px-2">
            <div className="-mb-2">{adjustedRecipe?.time.toNumber()}s</div>
            <Icon
              icon="material-symbols:arrow-right-alt"
              className="text-3xl"
            />
          </div>
          {adjustedRecipe?.out &&
            Object.keys(adjustedRecipe.out).map((e) => (
              <div key={e} className="flex items-center">
                <IconItem name={e}>{adjustedRecipe.out[e].toNumber()}</IconItem>
              </div>
            ))}
        </Stack>
      </div>

      <div className="">
        {inKeys.map((e) => (
          <ProducerProgress
            key={e}
            id={e}
            itemId={itemId}
            machineId={id}
            type="in"
          />
        ))}
      </div>
      <div className="">
        {outKeys.map((e) => (
          <ProducerProgress
            key={e}
            id={e}
            itemId={itemId}
            machineId={id}
            type="out"
          />
        ))}
      </div>
    </div>
  );
};

export default ProducerEntity;

const ProducerProgress = (props: {
  id: string;
  itemId: string;
  machineId: string;
  type: 'in' | 'out';
}) => {
  const { id, itemId, machineId, type } = props;

  const producer = useAppSelector((state) =>
    selectProducerFromRecordById(state, { itemId, machineId })
  );

  const item = useMemo(() => producer?.[type]?.[id], [id, producer, type]);
  const progress = useMemo(
    () => item?.amount.div(item.stock).mul(rational(100)).toNumber() ?? 0,
    [item]
  );

  return (
    <div className="flex items-center">
      <IconItem name={id}>{item?.amount.toPrecision(2)}</IconItem>
      <div className="flex-1 pl-3">
        <LinearProgress value={progress} />
      </div>
    </div>
  );
};
