import { useAppSelector } from '@/store/hooks';
import {
  selectItemEntityById,
  selectItemStatusById,
  selectRecipeEntityById,
} from '@/store/modules/recipesSlice';
import { selectItemRecordById } from '@/store/modules/recordsSlice';
import clsx from 'clsx';
import IconItem from './IconItem';

interface Props {
  id: string;
  onClick: () => void;
}

const ItemEntity = ({ id, onClick }: Props) => {
  const recipeEntity = useAppSelector((state) =>
    selectRecipeEntityById(state, id)
  );
  const itemEntity = useAppSelector((state) => selectItemEntityById(state, id));
  const itemRecord = useAppSelector((state) => selectItemRecordById(state, id));
  const { canManualCrafting, canMake } = useAppSelector((state) =>
    selectItemStatusById(state, id)
  );

  if (!recipeEntity || !itemEntity) return;

  return (
    <div
      className={clsx('select-none p-1', {
        '!bg-orange-500': !canManualCrafting,
        'bg-red-500': !canMake,
      })}
      onClick={onClick}
    >
      <IconItem name={itemEntity.icon ?? id} text={itemEntity.iconText}>
        {itemRecord?.stock.toNumber() ?? 0}
      </IconItem>
    </div>
  );
};

export default ItemEntity;
