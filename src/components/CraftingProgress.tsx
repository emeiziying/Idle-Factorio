import clsx from 'clsx';
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface CraftingProgressHandle {
  start: () => Promise<void>;
}

export interface CraftingProgressProps {
  duration: number;
}

const CraftingProgress = forwardRef<
  CraftingProgressHandle,
  CraftingProgressProps
>(({ duration }, ref) => {
  const [width, setWidth] = useState(0);

  useImperativeHandle(ref, () => ({
    start: () => {
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
        className={clsx(
          'h-1 bg-slate-300 w-0',
          width === 100 && 'w-full',
          width === 0 && '!duration-0'
        )}
        style={{ transition: `width ${duration}s` }}
      />
    </div>
  );
});

CraftingProgress.displayName = 'CraftingProgress';

export default CraftingProgress;
