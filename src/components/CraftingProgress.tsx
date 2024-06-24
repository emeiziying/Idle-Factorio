import { forwardRef, useImperativeHandle, useState } from 'react';

export interface CraftingProgressHandle {
  start: (duration: number) => Promise<void>;
}

const CraftingProgress = forwardRef<CraftingProgressHandle>((_, ref) => {
  const [width, setWidth] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    start: (duration: number) => {
      console.log('start', duration);
      setDuration(duration);
      setWidth(100);
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('end');
          setWidth(0);
          resolve();
        }, duration * 1000);
      });
    },
  }));

  return (
    <div className="w-full bg-white">
      <div
        className="h-1 transition-width w-0 bg-slate-300"
        style={{
          transitionDuration: `${duration}s`,
          transition: 'width',
          width: `${width}%`,
        }}
      />
    </div>
  );
});

CraftingProgress.displayName = 'CraftingProgress';

export default CraftingProgress;
