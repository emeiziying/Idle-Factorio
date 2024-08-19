import { Rational, rational } from '../rational';

export interface ContainerJson {
  size: number | string;
}

export interface Container {
  size: Rational;
}

export function parseContainer(json: ContainerJson): Container;
export function parseContainer(
  json: ContainerJson | undefined
): Container | undefined;
export function parseContainer(
  json: ContainerJson | undefined
): Container | undefined {
  if (json == null) return;
  return { size: rational(json.size) };
}
