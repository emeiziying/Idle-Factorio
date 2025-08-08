import GameConfig from '@/services/core/GameConfig';
import PowerService from '@/services/game/PowerService';
import type { FacilityInstance } from '@/types/facilities';
import { describe, expect, it } from 'vitest';

interface MockItem {
  id: string;
  machine?: { type: string; usage?: number };
}

class MockDataService {
  private items: Record<string, MockItem>;
  constructor(items: Record<string, MockItem>) {
    this.items = items;
  }
  getItem(id: string): MockItem | undefined {
    return this.items[id];
  }
}

describe('PowerService', () => {
  const items: Record<string, MockItem> = {
    'assembling-machine-1': {
      id: 'assembling-machine-1',
      machine: { type: 'electric', usage: 150 },
    },
    'solar-panel': { id: 'solar-panel', machine: { type: 'electric', usage: 60 } },
  };
  const dataService = new MockDataService(items);
  const gameConfig = new GameConfig(dataService as unknown as never);
  const powerService = new PowerService(dataService as unknown as never, gameConfig);

  it('calculates power balance (deficit/surplus)', () => {
    const facilities: FacilityInstance[] = [
      { id: 'f1', facilityId: 'assembling-machine-1', count: 1, status: 'running', efficiency: 1 },
      { id: 'g1', facilityId: 'solar-panel', count: 1, status: 'running', efficiency: 1 },
    ];

    const balance = powerService.calculatePowerBalance(facilities);
    // solar 60kW * 0.7 = 42kW vs assembling 150kW → deficit
    expect(balance.generationCapacity).toBeGreaterThan(0);
    expect(balance.consumptionDemand).toBeGreaterThan(0);
    expect(balance.status).toBe('deficit');
  });

  it('updates facility efficiency based on balance', () => {
    const facility: FacilityInstance = {
      id: 'f1',
      facilityId: 'assembling-machine-1',
      count: 1,
      status: 'running',
      efficiency: 1,
      production: { progress: 0, inputBuffer: [], outputBuffer: [] },
    };

    // 构造赤字
    const deficitBalance = {
      generationCapacity: 0,
      actualGeneration: 0,
      generationByType: {},
      consumptionDemand: 150,
      actualConsumption: 0,
      consumptionByCategory: {},
      satisfactionRatio: 0,
      status: 'deficit' as const,
    };

    const updated1 = powerService.updateFacilityPowerStatus(facility, deficitBalance);
    expect(updated1.status).toBe('no_power');
    expect(updated1.efficiency).toBe(0);

    // 构造平衡/充足
    const okBalance = {
      ...deficitBalance,
      generationCapacity: 200,
      satisfactionRatio: 1,
      status: 'balanced' as const,
    };
    const updated2 = powerService.updateFacilityPowerStatus(facility, okBalance);
    expect(updated2.status).toBe('running');
    expect(updated2.efficiency).toBe(1);
  });
});
