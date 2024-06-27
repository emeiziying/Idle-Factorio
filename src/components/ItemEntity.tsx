import CraftingButton from '@/components/CraftingButton';
import IconItem from '@/components/IconItem';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getAdjustedDataset } from '@/store/modules/recipesSlice';
import { recordsState, type ItemRecord } from '@/store/modules/recordsSlice';
import { Tooltip } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  id: string;
}

const ItemEntity = ({ id }: Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const adjustedDataset = useAppSelector(getAdjustedDataset);
  const records = useAppSelector(recordsState);

  const itemEntity = useMemo(
    () => adjustedDataset.itemEntities[id],
    [adjustedDataset, id]
  );

  const recipeEntity = useMemo(
    () => adjustedDataset.recipeEntities[id],
    [adjustedDataset, id]
  );

  const itemRecord = useMemo<ItemRecord | undefined>(
    () => records[id],
    [records, id]
  );

  const canManualCrafting = useMemo(() => {
    return recipeEntity.category !== 'smelting';
  }, [recipeEntity]);

  return (
    <div>
      <Tooltip
        open
        title={
          <div className="text-black">
            <div>
              {itemEntity.name}({t('data.recipe')})
            </div>
            <div>
              <div>{t('data.ingredients')}:</div>
              <div>
                {Object.keys(recipeEntity.in).map((id) => (
                  <div key={id} className="flex items-center">
                    <IconItem name={id}></IconItem>
                    <div>
                      {recipeEntity.in[id].toNumber()} x{' '}
                      {adjustedDataset.recipeEntities[id]?.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center">
                {recipeEntity.time.toNumber()}s time
              </div>
            </div>
            <div className="flex items-start">
              <div>
                <div>原料合计:</div>
                <div>total time</div>
              </div>
              <div>{/*  */}</div>
            </div>

            <div className="flex items-center">
              <div className="pr-1">{t('data.producers')}:</div>
              {recipeEntity.producers.map((id) => (
                <IconItem key={id} name={id} />
              ))}
            </div>
          </div>
        }
      >
        <div className="p-1">
          <IconItem name={itemEntity.icon ?? id} text={itemEntity.iconText} />
          <div>
            {itemEntity.name}-{itemEntity.id}
            <div>time:{recipeEntity.time.toNumber()}</div>
            <div>stock:{itemRecord?.stock.toNumber() ?? 0}</div>
            {canManualCrafting && <CraftingButton id={id} />}
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

export default ItemEntity;
