import { Rational } from '@/models';
import { useAppDispatch, useAppStore } from '@/store/hooks';
import { selectAdjustedRecipeByIdWithProducer } from '@/store/modules/recipesSlice';
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

        inKeys.forEach((inId) => {
          const amount = recipe.in[inId];
          if (producer.in?.[inId].amount.lt(amount)) {
            // not enough amount
            if (records[inId].stock.gte(amount)) {
              const diffAmount = new Rational(BigInt(delta), BigInt(1000))
                .div(recipe.time)
                .mul(amount);

              console.log('diffAmount', diffAmount.toNumber());

              // get from stock
              // dispatch(subItemStock({ id: inId, amount }));
              // dispatch(
              //   updateProducerInItem({
              //     itemId: id,
              //     producerId,
              //     inId,
              //     data: {
              //       stock: rational(1),
              //       amount: rational(1),
              //     },
              //   })
              // );
            }
          }
        });
      });
    });
  }, 16);

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
