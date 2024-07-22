import { rational } from '@/models';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import { addToQueue } from '@/store/modules/craftingsSlice';
import {
  getRecipeEntities,
  selectItemEntityById,
  selectItemStatusById,
  selectRecipeEntityById,
} from '@/store/modules/recipesSlice';
import {
  selectItemRecordEntities,
  subItemStock,
} from '@/store/modules/recordsSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
} from '@mui/material';
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
  const store = useAppStore();
  const dispatch = useAppDispatch();

  const itemEntity = useAppSelector((state) =>
    selectItemEntityById(state, itemId)
  );
  const { canManualCrafting, canMake } = useAppSelector((state) =>
    selectItemStatusById(state, itemId)
  );
  const availableRecipes = useAppSelector(getAvailableRecipes);
  const records = useAppSelector(selectItemRecordEntities);

  const recipeEntity = useAppSelector((state) =>
    selectRecipeEntityById(state, itemId)
  );
  const recipeEntities = useAppSelector(getRecipeEntities);

  // const records = useMemo(() => {
  //   const state = store.getState();
  //   const recordEntities = selectItemRecordEntities(state);

  //   return Object.keys(recipeEntity?.in ?? {}).reduce(
  //     (pre, cur) => (pre[cur] = recordEntities[cur]),
  //     {} as Record<string, ItemRecord>
  //   );
  // }, [recipeEntity, store]);

  const inIds = useMemo(
    () => Object.keys(recipeEntity?.in ?? {}),
    [recipeEntity?.in]
  );

  const outIds = useMemo(
    () => Object.keys(recipeEntity?.out ?? {}),
    [recipeEntity?.out]
  );

  useWhyDidYouUpdate(`ItemConfig id:${itemId}`, {
    recipeEntity,
    itemEntity,
    canManualCrafting,
    canMake,
    availableRecipes,
    recipeEntities,
    records,
    inIds,
    outIds,
    store,
  });

  if (!recipeEntity || !itemEntity) return;

  return (
    <Card>
      {void console.log('ItemConfig update')}
      <CardHeader title={`${itemEntity.name}(${t('data.recipe')})`} />
      <CardContent>
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
        >
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
          {/* Crafting */}
          <div className="flex items-center">
            <div>Crafting:</div>
            <Stack spacing={1} className="flex-1 pl-2">
              {canManualCrafting && (
                <Button
                  variant="contained"
                  size="small"
                  disabled={!canMake}
                  onClick={() => {
                    dispatch(addToQueue([{ itemId, amount: rational(1) }]));
                    Object.keys(recipeEntity.in).forEach((id) => {
                      dispatch(
                        subItemStock({ id, amount: recipeEntity.in[id] })
                      );
                    });
                  }}
                >
                  Manual {recipeEntity.time.toNumber()}s
                </Button>
              )}
              {recipeEntity.producers
                .filter((e) => availableRecipes.includes(e))
                .map((id) => (
                  <ProducerEntity key={id} itemId={itemId} id={id} />
                ))}
            </Stack>
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ItemConfig;
