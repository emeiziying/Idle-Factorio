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
  recordsState,
  subItemStock,
} from '@/store/modules/recordsSlice';
import { getAvailableRecipes } from '@/store/modules/settingsSlice';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
} from '@mui/material';
import { useWhyDidYouUpdate } from 'ahooks';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import IconItem from './IconItem';
import ProducerEntity from './ProducerEntity';

interface ItemConfigDialogProps extends DialogProps {
  itemId: string;
}

const ItemConfigDialog = (props: ItemConfigDialogProps) => {
  const { itemId, ...rest } = props;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const recipeEntity = useAppSelector(getRecipeEntityById(itemId));
  const itemEntity = useAppSelector(getItemEntityById(itemId));
  const { canManualCrafting, canMake } = useAppSelector(getItemStatus(itemId));
  const availableRecipes = useAppSelector(getAvailableRecipes);
  const records = useAppSelector(recordsState);
  const itemRecord = useAppSelector(getItemRecordById(itemId));
  const recipeEntities = useAppSelector(getRecipeEntities);

  useWhyDidYouUpdate('ItemConfigDialog', { itemRecord });

  if (!recipeEntity || !itemEntity) return;

  return (
    <Dialog {...rest} fullWidth maxWidth="sm">
      <DialogTitle>
        {itemEntity.name}({itemId})
      </DialogTitle>
      <DialogContent>
        <Card className="mb-4">
          <CardHeader
            title={
              <div>
                {itemEntity.name}({t('data.recipe')})
              </div>
            }
          />
          <CardContent>
            <div className="text-black">
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
                        {recipeEntities[inId]?.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end">
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
                <div className="text-orange-500">
                  Can&apos;t manual crafting
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div>
              <div className="flex">
                <div>Crafting:</div>
                <div className="flex flex-wrap items-center">
                  {canManualCrafting && (
                    <div className="px-3">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!canMake}
                        onClick={() => {
                          dispatch(
                            addToQueue([
                              { id: itemId, amount: new Rational(1n) },
                            ])
                          );
                          Object.keys(recipeEntity.in).forEach((id) => {
                            dispatch(
                              subItemStock({ id, stock: recipeEntity.in[id] })
                            );
                          });
                        }}
                      >
                        Manual
                      </Button>
                    </div>
                  )}
                  {recipeEntity.producers
                    .filter((e) => availableRecipes.includes(e))
                    .map((id) => (
                      <div key={id} className="items-center2 flex px-3">
                        <ProducerEntity itemId={itemId} id={id} />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ItemConfigDialog;
