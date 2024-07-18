import { Entities } from './entities';
import { Rational } from './rational';

export interface ItemRecord {
  id: string;
  stock: Rational;
  producers?: Entities<ItemProducer>;
}

export interface ItemProducer {
  amount: Rational;
  in?: Entities<ItemProducerIn>;
}

export interface ItemProducerIn {
  stock: Rational;
  amount: Rational;
}
