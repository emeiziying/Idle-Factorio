import { Rational, rational } from '../rational';

export interface StorageTankJson {
  capacity: number | string;
}

export interface StorageTank {
  capacity: Rational;
}

export function parseStorageTank(json: StorageTankJson): StorageTank;
export function parseStorageTank(
  json: StorageTankJson | undefined
): StorageTank | undefined;
export function parseStorageTank(
  json: StorageTankJson | undefined
): StorageTank | undefined {
  if (json == null) return;
  return { capacity: rational(json.capacity) };
}
