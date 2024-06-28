import IconItem from '@/components/IconItem';
import { Rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToQueue } from '@/store/modules/craftingSlice';
import { getAdjustedDataset } from '@/store/modules/recipesSlice';
import { recordsState, type ItemRecord } from '@/store/modules/recordsSlice';
import { Tooltip } from '@mui/material';
import clsx from 'clsx';
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
    return !['smelting', 'fluids'].includes(recipeEntity.category);
  }, [recipeEntity]);

  const canMake = useMemo(
    () =>
      Object.keys(recipeEntity.in).every((e) =>
        records[e]?.stock.gte(recipeEntity.in[e])
      ),
    [recipeEntity.in, records]
  );

  return (
    <div className="select-none">
      <Tooltip
        title={
          <div className="text-white">
            <div>
              {itemEntity.name}({t('data.recipe')})
            </div>
            <div>
              <div>{t('data.ingredients')}:</div>
              <div>
                {Object.keys(recipeEntity.in).map((inId) => (
                  <div key={inId} className="flex items-center">
                    <IconItem name={inId}></IconItem>
                    <div
                      className={clsx({
                        'text-red-500':
                          !records[inId] ||
                          recipeEntity.in[inId].gt(records[inId].stock),
                      })}
                    >
                      {recipeEntity.in[inId].toNumber()}x
                      {adjustedDataset.recipeEntities[inId]?.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center">
                {recipeEntity.time.toNumber()}s time
              </div>
            </div>

            <div className="flex items-center">
              <div className="pr-1">{t('data.producers')}:</div>
              {recipeEntity.producers.map((id) => (
                <IconItem key={id} name={id} />
              ))}
            </div>
            {!canManualCrafting && (
              <div className="text-orange-500">Can&apos;t manual crafting</div>
            )}
          </div>
        }
      >
        <div
          className={clsx('p-1', {
            '!bg-orange-500': !canManualCrafting,
            'bg-red-500': !canMake,
          })}
          onClick={() => {
            if (!canManualCrafting) {
              return;
            }
            if (!canMake) {
              return;
            }
            // dispatch(addItemStock({ id, stock: new Rational(1n) }));
            dispatch(addToQueue([{ id, amount: new Rational(1n) }]));
          }}
        >
          <IconItem name={itemEntity.icon ?? id} text={itemEntity.iconText}>
            {itemRecord?.stock.toNumber() ?? 0}
          </IconItem>
        </div>
      </Tooltip>
    </div>
  );
};

export default ItemEntity;
