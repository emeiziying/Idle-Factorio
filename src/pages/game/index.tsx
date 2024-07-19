import { useAppDispatch } from '@/store/hooks';
import { Container, Stack } from '@mui/material';
import { useRafInterval } from 'ahooks';
import { useRef } from 'react';
import GameContainer from './components/GameContainer';
import ManualQueue, { ManualQueueHandle } from './components/ManualQueue';
import TechnologyPanel from './components/TechnologyPanel';

let timestamp = 0;

const Game = () => {
  const dispatch = useAppDispatch();

  const manualQueue = useRef<ManualQueueHandle>(null);

  // const first = useAppSelector(getFirst);

  useRafInterval(() => {
    const now = Date.now();
    const delta = timestamp ? now - timestamp : 0;
    timestamp = now;

    manualQueue.current?.update(delta);
    // dispatch(UPDATE_FIRST(delta));

    // first &&
    //   dispatch(
    //     UPDATE_FIRST({
    //       ...first,
    //       progress: 50,
    //     })
    //   );
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
