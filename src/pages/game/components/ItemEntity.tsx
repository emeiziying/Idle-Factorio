import { useAppSelector } from '@/store/hooks';
import {
  getAdjustedDataset,
  getItemEntityById,
  getItemStatus,
  getRecipeEntityById,
} from '@/store/modules/recipesSlice';
import { getItemRecordById, recordsState } from '@/store/modules/recordsSlice';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import IconItem from './IconItem';

interface Props {
  id: string;
  onClick: () => void;
}

const ItemEntity = ({ id, onClick }: Props) => {
  const { t } = useTranslation();
  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const records = useAppSelector(recordsState);
  const recipeEntity = useAppSelector(getRecipeEntityById(id));
  const itemEntity = useAppSelector(getItemEntityById(id));
  const itemRecord = useAppSelector(getItemRecordById(id));
  const { canManualCrafting, canMake } = useAppSelector(getItemStatus(id));

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
