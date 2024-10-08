import { getIdOptions } from '@/helpers';
import { EnergyType, type Entities, type MachineSettings } from '@/models';
import {
  getDataset,
  getDefaults,
  getFuelRankIds,
} from '@/store/modules/settingsSlice';
import type { RootState } from '@/store/store';
import { RecipeUtility } from '@/utilities';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export interface MachinesState {
  ids?: string[];
  entities: Entities<MachineSettings>;
}

export const initialMachinesState: MachinesState = {
  entities: {},
};

export const machinesSlice = createSlice({
  name: 'machines',
  initialState: initialMachinesState,
  reducers: {},
});

/* Base selector functions */
export const machinesState = (state: RootState): MachinesState =>
  state.machines;

/* Complex selectors */
export const getMachinesState = createSelector(
  [machinesState, getFuelRankIds, getDefaults, getDataset],
  (state, fuelRankIds, defaults, data) => {
    const ids = state.ids ?? defaults?.machineRankIds ?? [];

    const entities: Entities<MachineSettings> = {};
    const def: MachineSettings = { ...state.entities[''] };
    def.moduleRankIds = def.moduleRankIds ?? defaults?.moduleRankIds ?? [];
    def.moduleOptions = getIdOptions(data.moduleIds, data.itemEntities, true);
    def.beaconCount = def.beaconCount ?? defaults?.beaconCount;
    def.beaconId = def.beaconId ?? defaults?.beaconId;
    def.beaconModuleRankIds =
      def.beaconModuleRankIds ?? (defaults ? [defaults.beaconModuleId] : []);
    if (def.beaconId) {
      const beacon = data.beaconEntities[def.beaconId];
      def.beaconModuleOptions = RecipeUtility.moduleOptions(beacon, null, data);
    }

    entities[''] = def;

    for (const id of data.machineIds.filter((i) => data.itemEntities[i])) {
      const s: MachineSettings = { ...state.entities[id] };
      const machine = data.machineEntities[id];

      if (machine.type === EnergyType.Burner) {
        s.fuelOptions = RecipeUtility.fuelOptions(machine, data);
        s.fuelId =
          s.fuelId ??
          RecipeUtility.bestMatch(
            s.fuelOptions.map((o) => o.value),
            fuelRankIds
          );
      }

      if (machine.modules) {
        s.moduleRankIds = s.moduleRankIds ?? def.moduleRankIds;
        s.moduleOptions = RecipeUtility.moduleOptions(machine, null, data);
        s.beaconCount = s.beaconCount ?? def.beaconCount;
        s.beaconId = s.beaconId ?? def.beaconId;
        s.beaconModuleRankIds =
          s.beaconModuleRankIds ?? def.beaconModuleRankIds;
        if (s.beaconId) {
          const beacon = data.beaconEntities[s.beaconId];
          s.beaconModuleOptions = RecipeUtility.moduleOptions(
            beacon,
            null,
            data
          );
        }
      }

      entities[id] = s;
    }

    return { ids, entities };
  }
);

export default machinesSlice.reducer;
