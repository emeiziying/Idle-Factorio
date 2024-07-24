import { rational, Rational } from '@/models';
import { useAppDispatch, useAppStore } from '@/store/hooks';
import { selectAdjustedRecipeByIdWithProducer } from '@/store/modules/recipesSlice';
import { updateProducerInItem } from '@/store/modules/recordsSlice';
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

    manualQueue.current?.update(delta);
    // update producer

    const state = store.getState();
    const { ids, entities: records } = state.records;
    ids.forEach((id) => {
      const { producers } = records[id];
      if (!producers) return;
      Object.keys(producers).forEach((producerId) => {
        const recipe = selectAdjustedRecipeByIdWithProducer(state, {
          recipeId: id,
          machineId: producerId,
        });
        if (!recipe) return;

        const producer = producers[producerId];
        const inKeys = Object.keys(recipe.in);

        if (producer.amount.lte(rational(0))) return;

        inKeys.forEach((inId) => {
          const recipeAmount = recipe.in[inId];
          const diffAmount = new Rational(BigInt(delta), BigInt(1000))
            .div(recipe.time)
            .mul(recipeAmount)
            .mul(producer.amount);
          const inAmount = producer.in?.[inId]?.amount ?? rational(0);

          // not enough amount
          if (inAmount.lt(diffAmount)) {
            // get from stock
            if (records[inId].stock.gte(recipeAmount)) {
              console.log('diffAmount', inId, diffAmount.toNumber());

              // get from stock
              // dispatch(subItemStock({ id: inId, amount: recipeAmount }));
              dispatch(
                updateProducerInItem({
                  itemId: id,
                  producerId,
                  inId,
                  data: {
                    stock: rational(1),
                    amount: inAmount.add(recipeAmount),
                  },
                })
              );
            }
          } else {
            // update amount
            dispatch(
              updateProducerInItem({
                itemId: id,
                producerId,
                inId,
                data: {
                  stock: rational(1),
                  amount: inAmount.sub(diffAmount),
                },
              })
            );
          }
        });
      });
    });
  }, 100);

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
