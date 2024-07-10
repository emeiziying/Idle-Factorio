import { Rational } from '@/models';
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
        // wait dom reload
        duration -= dt;
      } else if (duration < 0) {
        // start new
        duration = recipe.time.toNumber() * 1000;
        setWorking(true);
      } else {
        duration -= dt;

        // finish
        if (duration <= 0) {
          setWorking(false);
          const one = new Rational(1n);
          dispatch(addItemStock({ id: first.id, amount: one }));
          dispatch(updateFirst(one));

          duration = 0;
        }
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
