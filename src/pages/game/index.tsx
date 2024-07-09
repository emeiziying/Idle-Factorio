import { Container, Stack } from '@mui/material';
import { useRafInterval } from 'ahooks';
import { useRef } from 'react';
import GameContainer from './components/GameContainer';
import ManualQueue, { ManualQueueHandle } from './components/ManualQueue';
import TechnologyPanel from './components/TechnologyPanel';

let timestamp = 0;

const Game = () => {
  const manualQueue = useRef<ManualQueueHandle>(null);

  useRafInterval(() => {
    const now = Date.now();
    const delta = timestamp ? now - timestamp : 0;
    timestamp = now;

    manualQueue.current?.update(delta);
  }, 16);

  return (
    <>
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
