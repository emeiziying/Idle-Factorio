import { Rational, rational } from '../rational';

export interface GeneratorJson {
  usage: number | string;
}

export interface Generator {
  usage: Rational;
}

export function parseGenerator(json: GeneratorJson): Generator;
export function parseGenerator(
  json: GeneratorJson | undefined
): Generator | undefined;
export function parseGenerator(
  json: GeneratorJson | undefined
): Generator | undefined {
  if (json == null) return;
  return { usage: rational(json.usage) };
}
