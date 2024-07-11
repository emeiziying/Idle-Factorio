import { Rational } from '@/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToQueue } from '@/store/modules/craftingSlice';
import {
  getItemEntityById,
  getItemStatus,
  getRecipeEntities,
  getRecipeEntityById,
} from '@/store/modules/recipesSlice';
import {
  getItemRecordById,
  getRecordEntities,
  subItemStock,
} from '@/store/modules/recordsSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import { Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useWhyDidYouUpdate } from 'ahooks';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import IconItem from './IconItem';
import ProducerEntity from './ProducerEntity';

interface ItemConfigProps {
  itemId: string;
}

const ItemConfig = ({ itemId }: ItemConfigProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const recipeEntity = useAppSelector(getRecipeEntityById(itemId));
  const itemEntity = useAppSelector(getItemEntityById(itemId));
  const { canManualCrafting, canMake } = useAppSelector(getItemStatus(itemId));
  const availableRecipes = useAppSelector(getAvailableRecipes);
  const records = useAppSelector(getRecordEntities);
  const itemRecord = useAppSelector(getItemRecordById(itemId));
  const recipeEntities = useAppSelector(getRecipeEntities);

  const inIds = useMemo(
    () => Object.keys(recipeEntity?.in ?? {}),
    [recipeEntity?.in]
  );

  const outIds = useMemo(
    () => Object.keys(recipeEntity?.out ?? {}),
    [recipeEntity?.out]
  );

  useWhyDidYouUpdate('ItemConfig', { itemRecord });

  if (!recipeEntity || !itemEntity) return;

  return (
    <Stack spacing={2}>
      <Card className="mb-4">
        <CardHeader
          title={
            <div>
              {itemEntity.name}({t('data.recipe')})
            </div>
          }
        />
        <CardContent>
          <Stack spacing={1}>
            {/* Ingredient */}
            {inIds.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <div>{t('data.ingredients')}:</div>
                {inIds.map((inId) => (
                  <div key={inId} className="flex items-center">
                    <div
                      className={clsx({
                        'bg-red-500':
                          !records[inId] ||
                          recipeEntity.in[inId].gt(records[inId].stock),
                      })}
                    >
                      <IconItem name={inId} />
                    </div>
                    <div className="pl-1">
                      {recipeEntity.in[inId].toNumber()}x
                      {recipeEntities[inId]?.name}
                    </div>
                  </div>
                ))}
              </Stack>
            )}
            {/* Producer */}
            {outIds.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <div className="pr-1">{t('data.producers')}:</div>
                {recipeEntity.producers.map((id) => (
                  <IconItem key={id} name={id} />
                ))}
                {!canManualCrafting && (
                  <div className="text-orange-500">
                    Can&apos;t manual crafting
                  </div>
                )}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center">
          <div>Crafting:</div>
          <Stack spacing={1} className="pl-2">
            {canManualCrafting && (
              <Button
                variant="contained"
                size="small"
                disabled={!canMake}
                onClick={() => {
                  dispatch(
                    addToQueue([{ id: itemId, amount: new Rational(1n) }])
                  );
                  Object.keys(recipeEntity.in).forEach((id) => {
                    dispatch(subItemStock({ id, amount: recipeEntity.in[id] }));
                  });
                }}
              >
                Manual
              </Button>
            )}
            {recipeEntity.producers
              .filter((e) => availableRecipes.includes(e))
              .map((id) => (
                <ProducerEntity key={id} itemId={itemId} id={id} />
              ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ItemConfig;
