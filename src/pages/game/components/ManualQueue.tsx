import IconItem from '@/components/IconItem';
import { Rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { manualQueue, updateFirst } from '@/store/modules/craftingSlice';
import { getAdjustedDataset } from '@/store/modules/recipesSlice';
import { addItemStock } from '@/store/modules/recordsSlice';
import { useRafInterval, useWhyDidYouUpdate } from 'ahooks';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import './ManualQueue.css';

let timestamp = 0;
let duration = 0;

const ManualQueue = () => {
  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const queue = useAppSelector(manualQueue);
  const dispatch = useAppDispatch();

  const [working, setWorking] = useState(false);

  const itemEntities = useMemo(
    () => adjustedDataset.itemEntities,
    [adjustedDataset]
  );
  const recipeEntities = useMemo(
    () => adjustedDataset.recipeEntities,
    [adjustedDataset]
  );

  useRafInterval(() => {
    const first = queue.at(0);
    const recipe = first ? recipeEntities[first.id] : null;
    if (!first || !recipe) {
      duration = 0;
      return;
    }

    const now = Date.now();
    const delta = timestamp ? now - timestamp : 0;
    timestamp = now;

    if (duration === 0) {
      duration = recipe.time.toNumber() * 1000;
      setWorking(true);
    } else {
      duration -= delta;

      if (duration < 0) {
        setWorking(false);
        const one = new Rational(1n);
        dispatch(addItemStock({ id: first.id, stock: one }));
        dispatch(updateFirst(one));

        duration = 0;
      }
    }
  }, 16);

  useWhyDidYouUpdate('ManualQueue', { queue, working });

  return (
    <div className="fixed left-4 bottom-4 flex flex-wrap max-w-96">
      {queue.map((e, i) => (
        <div key={i} className="p-1 relative">
          <IconItem name={e.id}>{e.amount.toNumber()}</IconItem>
          {i === 0 && (
            <div className=" absolute w-full h-full bg-black/30 left-0 top-0 inline-block">
              <div
                className={clsx('progress w-full h-full', { working })}
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
};

export default ManualQueue;
