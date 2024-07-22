import { rational } from '@/models';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import {
  selectCraftingById,
  selectCraftingIds,
  updateQueueItem,
} from '@/store/modules/craftingsSlice';
import { selectRecipeEntityById } from '@/store/modules/recipesSlice';
import { addItemStock } from '@/store/modules/recordsSlice';
import { forwardRef, useImperativeHandle } from 'react';
import IconItem from './IconItem';
import './ManualQueue.css';
import PieProgress from './PieProgress';

export interface ManualQueueHandle {
  update: (dt: number) => void;
}

const ManualQueue = forwardRef<ManualQueueHandle>((_, ref) => {
  const craftingIds = useAppSelector(selectCraftingIds);
  const dispatch = useAppDispatch();
  const store = useAppStore();

  useImperativeHandle(ref, () => ({
    update: (dt) => {
      const state = store.getState();
      const firstId = craftingIds.at(0);
      if (!firstId) return;
      const entity = selectCraftingById(state, firstId);
      if (!entity) return;
      const recipe = selectRecipeEntityById(state, entity.itemId);

      if (!recipe) {
        // no recipe, remove from queue
        dispatch(updateQueueItem({ ...entity, amount: rational(0) }));
        return;
      }
      const time = recipe.time.toNumber() * 1000;
      const progress = (entity.progress ?? 0) + (dt / time) * 100;
      if (progress >= 100) {
        // finish, update amount, reset progress
        dispatch(
          updateQueueItem({
            ...entity,
            amount: entity.amount.sub(rational(1)),
            progress: 0,
          })
        );
        dispatch(addItemStock({ id: entity.itemId, amount: rational(1) }));
      } else {
        // update progress
        dispatch(updateQueueItem({ ...entity, progress }));
      }
    },
  }));

  return (
    <div className="fixed bottom-4 left-4 flex max-w-96 flex-wrap">
      {craftingIds.map((e, i) => (
        <QueueItem key={i} id={e} />
      ))}
    </div>
  );
});

ManualQueue.displayName = 'ManualQueue';

export default ManualQueue;

const QueueItem = ({ id }: { id: string }) => {
  const entity = useAppSelector((state) => selectCraftingById(state, id));

  return (
    <div className="relative p-1">
      <IconItem name={entity.itemId}>{entity.amount.toNumber()}</IconItem>
      <div className="absolute left-0 top-0 h-full w-full">
        <PieProgress value={entity.progress ?? 0} />
      </div>
    </div>
  );
};
