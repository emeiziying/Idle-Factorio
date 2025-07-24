import React from 'react';
import ItemDetailDialog from '../detail/ItemDetailDialog';
import type { Item } from '../../types/index';

interface ItemDetailDialogProps {
  item: Item;
  open: boolean;
  onClose: () => void;
}

const ItemDetailDialogWrapper: React.FC<ItemDetailDialogProps> = (props) => {
  return <ItemDetailDialog {...props} />;
};

export default ItemDetailDialogWrapper;