import GameContainer from '@/components/GameContainer';
import TechnologyPanel from '@/components/TechnologyPanel';
import { Container } from '@mui/material';
import ManualQueue from './components/ManualQueue';
import Steps from './components/Steps';

const Game = () => {
  return (
    <>
      <Container>
        <div>
          <GameContainer />
          <Steps />
          <div style={{ height: '20px' }} />
          <TechnologyPanel />
        </div>
      </Container>

      <ManualQueue />
    </>
  );
};

export default Game;
