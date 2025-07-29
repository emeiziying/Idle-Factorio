// Re-export from new location
export { DependencyService, dependencyService } from './game/DependencyService';
export type { CraftingDependency, CraftingChainAnalysis } from './game/DependencyService';
import { DependencyService as DefaultDependencyService } from './game/DependencyService';
export default DefaultDependencyService;