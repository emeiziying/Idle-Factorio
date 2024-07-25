import { rational, Rational } from '@/models';
import { useAppDispatch, useAppStore } from '@/store/hooks';
import { selectAdjustedRecipeByIdWithProducer } from '@/store/modules/recipesSlice';
import {
  addItemStock,
  subItemStock,
  updateProducerInItem,
  updateProducerOutItem,
} from '@/store/modules/recordsSlice';
import { Container, Stack } from '@mui/material';
import { useRafInterval } from 'ahooks';
import { useRef } from 'react';
import GameContainer from './components/GameContainer';
import ManualQueue, { ManualQueueHandle } from './components/ManualQueue';
import TechnologyPanel from './components/TechnologyPanel';

const Game = () => {
  const store = useAppStore();
  const dispatch = useAppDispatch();

  const manualQueue = useRef<ManualQueueHandle>(null);
  const timestamp = useRef(0);

  useRafInterval(() => {
    const now = Date.now();
    const delta = timestamp.current ? now - timestamp.current : 0;
    timestamp.current = now;

    if (delta > 1000) return;

    manualQueue.current?.update(delta);
    // update producer

    const zero = rational(0);
    const one = rational(1);
    const state = store.getState();
    const { ids, entities: records } = state.records;
    ids.forEach((itemId) => {
      const { producers } = records[itemId];
      if (!producers) return;
      Object.keys(producers).forEach((producerId) => {
        const recipe = selectAdjustedRecipeByIdWithProducer(state, {
          recipeId: itemId,
          machineId: producerId,
        });
        if (!recipe) return;
        const ratio = new Rational(BigInt(delta), BigInt(1000)).div(
          recipe.time
        );

        const producer = producers[producerId];
        const inKeys = Object.keys(recipe.in);
        const outKeys = Object.keys(recipe.out);

        if (producer.amount.lte(rational(0))) return;

        if (
          inKeys.length > 0 &&
          inKeys.some(
            (e) =>
              records[e].stock.lte(zero) &&
              (!producer.in || producer.in[e].amount.lte(zero))
          )
        )
          return;

        inKeys.forEach((inId) => {
          const recipeAmount = recipe.in[inId];
          const diffAmount = recipeAmount.mul(ratio).mul(producer.amount);
          const inAmount = producer.in?.[inId]?.amount ?? zero;
          const vv = (recipeAmount.gt(one) ? recipeAmount : one).mul(
            producer.amount
          );

          if (inAmount.lte(zero)) {
            if (records[inId].stock.gte(recipeAmount)) {
              // get from stock
              dispatch(subItemStock({ id: inId, amount: vv }));
              dispatch(
                updateProducerInItem({
                  itemId,
                  producerId,
                  inId,
                  data: { stock: vv, amount: inAmount.add(vv) },
                })
              );
            }
            return;
          }

          // update amount
          const amount = inAmount.lt(diffAmount)
            ? zero
            : inAmount.sub(diffAmount);
          dispatch(
            updateProducerInItem({
              itemId,
              producerId,
              inId,
              data: { stock: vv, amount },
            })
          );
        });

        outKeys.forEach((outId) => {
          const recipeAmount = recipe.out[outId];
          const diffAmount = recipeAmount.mul(ratio).mul(producer.amount);
          const outAmount = producer.out?.[outId]?.amount ?? zero;

          const vv = producer.amount;
          if (outAmount.gte(vv)) {
            dispatch(addItemStock({ id: outId, amount: vv }));
            dispatch(
              updateProducerOutItem({
                itemId,
                producerId,
                outId,
                data: { stock: vv, amount: outAmount.sub(vv) },
              })
            );

            return;
          }

          // update amount
          dispatch(
            updateProducerOutItem({
              itemId,
              producerId,
              outId,
              data: { stock: vv, amount: outAmount.add(diffAmount) },
            })
          );
        });
      });
    });
  }, 33);

  return (
    <>
      {void console.log('Game update')}

      <Container maxWidth="xl">
        <Stack spacing={2}>
          <GameContainer />
          <TechnologyPanel />
        </Stack>
      </Container>

      <ManualQueue ref={manualQueue} />
    </>
  );
};

export default Game;
