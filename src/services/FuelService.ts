// Re-export from new location
export { RefactoredFuelService as FuelService } from './game/RefactoredFuelService';

// 为了兼容性，也导出原有的类型
export type { FuelUpdateResult, AddFuelResult, AutoRefuelResult, FuelStatus } from './game/RefactoredFuelService';