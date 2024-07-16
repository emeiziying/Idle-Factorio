import { Rational } from '../rational';
import { BeaconSettings } from './beacon-settings';

export interface RecipeSettings {
  excluded?: boolean;
  checked?: boolean;
  machineId?: string;
  fuelId?: string;
  /** Calculated, not configurable */
  fuelOptions?: SelectItem<string>[];
  moduleIds?: string[];
  /** Calculated, not configurable */
  moduleOptions?: SelectItem<string>[];
  beacons?: BeaconSettings[];
  cost?: Rational;
}
