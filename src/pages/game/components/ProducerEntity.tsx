import { rational } from '@/models';
import { ItemProducerIn } from '@/models/record';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getAdjustedRecipeByIdWithProducer,
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
import { IconButton, LinearProgress, Stack } from '@mui/material';
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
  const adjustedRecipe = useAppSelector(
    getAdjustedRecipeByIdWithProducer(itemId, id)
  );
  const recipeEntity = useAppSelector(getRecipeEntityById(itemId));

  const machineEntity = useAppSelector(getMachineEntityById(id));

  const producer = useMemo(() => itemRecord?.producers?.[id], [itemRecord, id]);
  const producerAmount = useMemo(
    () => producer?.amount?.toNumber() ?? 0,
    [producer]
  );

  const consumption = useMemo(
    () => adjustedRecipe?.consumption?.toNumber() ?? 0,
    [adjustedRecipe]
  );

  const inKeys = useMemo(
    () => Object.keys(adjustedRecipe?.in ?? {}),
    [adjustedRecipe]
  );

  // const isWorking = useMemo(() => {
  //   const {amount,in,} = producer||{}
  //   return false;
  // }, []);

  useWhyDidYouUpdate(`ProducerEntity id:${id} itemId:${itemId}`, {
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
    <div>
      <div className="flex items-center">
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
          <div className="px-2">
            <IconItem name={id}>{producerAmount}</IconItem>
          </div>
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
          <ProducerInProgress key={e} name={e} data={producer?.in?.[e]} />
        ))}
      </div>
    </div>
  );
};

export default ProducerEntity;

const ProducerInProgress = (props: { name: string; data?: ItemProducerIn }) => {
  const { name, data } = props;

  const progress = useMemo(
    () => data?.amount.div(data.stock).mul(rational(100)).toNumber() ?? 0,
    [data]
  );

  return (
    <div className="flex items-center">
      <IconItem name={name}></IconItem>
      <div className="flex-1 pl-3">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </div>
  );
};
