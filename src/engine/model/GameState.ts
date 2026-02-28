export interface InventoryState {
  items: Record<string, number>;
  capacities?: Record<string, number>;
}

export interface FacilityProductionState {
  recipeId: string | null;
  progress: number;
}

export interface FacilityFuelState {
  itemId: string | null;
  quantity: number;
  remainingEnergy: number;
}

export interface FacilityState {
  id: string;
  facilityId: string;
  count: number;
  targetItemId: string | null;
  status: 'running' | 'stopped' | 'no_power' | 'no_resource' | 'output_full' | 'no_fuel';
  efficiency: number;
  production: FacilityProductionState | null;
  fuel: FacilityFuelState | null;
}

export interface ResearchState {
  currentTechId: string | null;
  progress: number;
  queue: string[];
  autoResearch: boolean;
}

export interface UnlockState {
  techs: string[];
  recipes: string[];
  items: string[];
  buildings: string[];
}

export interface PowerState {
  generation: number;
  consumption: number;
  satisfactionRatio: number;
}

export interface StatsState {
  totalItemsProduced: number;
  craftedItemCounts: Record<string, number>;
  builtEntityCounts: Record<string, number>;
  minedEntityCounts: Record<string, number>;
}

export interface GameState {
  simulationTimeMs: number;
  inventory: InventoryState;
  facilities: FacilityState[];
  research: ResearchState;
  unlocks: UnlockState;
  power: PowerState;
  stats: StatsState;
}
