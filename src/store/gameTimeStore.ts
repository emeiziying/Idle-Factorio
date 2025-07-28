// 游戏时间专用存储 - 不触发persist中间件
import { create } from 'zustand';

interface GameTimeState {
  gameTime: number;
  setGameTime: (time: number) => void;
  incrementGameTime: (deltaTime: number) => void;
}

const useGameTimeStore = create<GameTimeState>((set) => ({
  gameTime: 0,
  setGameTime: (time: number) => set({ gameTime: time }),
  incrementGameTime: (deltaTime: number) => set(state => ({ gameTime: state.gameTime + deltaTime }))
}));

export default useGameTimeStore;