import { rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { manualQueue, updateFirst } from '@/store/modules/craftingSlice';
import { getRecipeEntities } from '@/store/modules/recipesSlice';
import { addItemStock } from '@/store/modules/recordsSlice';
import clsx from 'clsx';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useSelector } from 'react-redux';
import IconItem from './IconItem';
import './ManualQueue.css';

export interface ManualQueueHandle {
  update: (dt: number) => void;
}

let duration = 0;

const ManualQueue = forwardRef<ManualQueueHandle>((_, ref) => {
  const recipeEntities = useSelector(getRecipeEntities);
  const queue = useAppSelector(manualQueue);
  const dispatch = useAppDispatch();

  const [working, setWorking] = useState(false);

  useImperativeHandle(ref, () => ({
    update: (dt) => {
      const first = queue.at(0);
      const recipe = first ? recipeEntities[first.id] : null;
      if (!first || !recipe) {
        duration = 0;
        working && setWorking(false);
        return;
      }

      if (duration === 0) {
        // start new work
        duration = recipe.time.toNumber() * 1000;
        setWorking(true);
      } else if (duration > 0) {
        duration -= dt;
        if (duration <= 0) {
          // finish
          setWorking(false);
          const one = rational(1);
          dispatch(addItemStock({ id: first.id, amount: one }));
          dispatch(updateFirst(one));
          duration = -1;
        }
      } else {
        // wait for next tick
        duration = 0;
      }
    },
  }));

  return (
    <div className="fixed bottom-4 left-4 flex max-w-96 flex-wrap">
      {queue.map((e, i) => (
        <div key={i} className="relative p-1">
          <IconItem name={e.id}>{e.amount.toNumber()}</IconItem>
          {i === 0 && (
            <div className="absolute left-0 top-0 inline-block h-full w-full bg-black/30">
              <div
                className={clsx('progress h-full w-full', { working })}
                style={{
                  transitionDuration: `${recipeEntities[e.id]?.time.toNumber()}s`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

ManualQueue.displayName = 'ManualQueue';

export default ManualQueue;
