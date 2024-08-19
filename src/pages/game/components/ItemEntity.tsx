import { useAppSelector } from '@/store/hooks';
import {
  selectCanMakeById,
  selectCanManualCraftingById,
  selectItemEntityById,
  selectRecipeEntityById,
} from '@/store/modules/recipesSlice';
import { selectStockFromRecordById } from '@/store/modules/recordsSlice';
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
  const canManualCrafting = useAppSelector((state) =>
    selectCanManualCraftingById(state, id)
  );
  const canMake = useAppSelector((state) => selectCanMakeById(state, id));
  const stock = useAppSelector((state) => selectStockFromRecordById(state, id));

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
        {stock?.toNumber() ?? 0}
      </IconItem>
    </div>
  );
};

export default ItemEntity;
