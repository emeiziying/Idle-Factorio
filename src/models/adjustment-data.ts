import { Rational } from './rational';

export interface AdjustmentData {
  miningBonus: Rational;
  researchBonus: Rational;
  netProductionOnly: boolean;
}
