import GameContainer from '@/components/GameContainer';
import TechnologyPanel from '@/components/TechnologyPanel';

const Game = () => {
  return (
    <div>
      <GameContainer />
      <div style={{ height: '20px' }} />
      <TechnologyPanel />
    </div>
  );
};

export default Game;
