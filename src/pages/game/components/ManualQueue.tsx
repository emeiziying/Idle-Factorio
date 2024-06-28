import IconItem from '@/components/IconItem';
import { useAppSelector } from '@/store/hooks';
import { manualQueue } from '@/store/modules/craftingSlice';
import { useWhyDidYouUpdate } from 'ahooks';
import './ManualQueue.css';

const ManualQueue = () => {
  const queue = useAppSelector(manualQueue);

  useWhyDidYouUpdate('ManualQueue', { queue });

  return (
    <div className="fixed left-4 bottom-4 flex flex-wrap max-w-96">
      {queue.map((e, i) => (
        <div key={i} className="p-1 relative">
          <IconItem name={e.id}>{e.amount.toNumber()}</IconItem>
          {i === 0 && (
            <div className=" absolute w-full h-full bg-black/30 left-0 top-0 inline-block">
              <div className="progress w-full h-full" style={{transitionDuration:`${}s`}}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManualQueue;
