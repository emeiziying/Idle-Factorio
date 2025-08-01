/**
 * 科技树服务
 * 管理科技树结构、数据查询和依赖关系
 */

import type { Technology, TechCategory, TechSearchFilter } from '../../../types/technology';
import { TechDataLoader } from './TechDataLoader';

export class TechTreeService {
  private techTree: Map<string, Technology> = new Map();
  private techOrder: string[] = []; // 保存科技在JSON中的原始顺序
  private techCategories: TechCategory[] = [];
  private dataLoader: TechDataLoader;
  
  // 依赖关系缓存
  private dependentsCache: Map<string, string[]> = new Map();
  private dependencyChainCache: Map<string, string[]> = new Map();

  constructor() {
    this.dataLoader = new TechDataLoader();
  }

  /**
   * 初始化科技树数据
   */
  async initialize(): Promise<void> {
    // 加载科技数据
    const { technologies, techOrder } = await this.dataLoader.loadTechnologiesFromDataJson();
    
    // 构建科技树
    this.techTree.clear();
    this.techOrder = techOrder;
    
    for (const tech of technologies) {
      this.techTree.set(tech.id, tech);
    }

    // 加载分类数据
    this.techCategories = await this.dataLoader.loadTechCategoriesFromDataJson();

    // 构建依赖关系缓存
    this.buildDependencyCache();
  }

  /**
   * 获取单个科技
   */
  getTechnology(techId: string): Technology | undefined {
    return this.techTree.get(techId);
  }

  /**
   * 获取所有科技
   */
  getAllTechnologies(): Technology[] {
    return Array.from(this.techTree.values());
  }

  /**
   * 按原始顺序获取所有科技
   */
  getAllTechnologiesInOriginalOrder(): Technology[] {
    return this.techOrder
      .map(id => this.techTree.get(id))
      .filter((tech): tech is Technology => tech !== undefined);
  }

  /**
   * 获取特定分类的科技
   */
  getTechnologiesByCategory(category: string): Technology[] {
    return Array.from(this.techTree.values())
      .filter(tech => tech.category === category);
  }

  /**
   * 搜索科技
   */
  searchTechnologies(filter: TechSearchFilter): Technology[] {
    let results = Array.from(this.techTree.values());

    // 按名称搜索
    if (filter.name) {
      const searchTerm = filter.name.toLowerCase();
      results = results.filter(tech => 
        tech.name.toLowerCase().includes(searchTerm) ||
        tech.id.toLowerCase().includes(searchTerm)
      );
    }

    // 按分类过滤
    if (filter.category) {
      results = results.filter(tech => tech.category === filter.category);
    }

    // 按状态过滤
    if (filter.status && filter.getStatus) {
      results = results.filter(tech => filter.getStatus!(tech.id) === filter.status);
    }

    // 按解锁内容过滤
    if (filter.unlocksItem) {
      results = results.filter(tech => 
        tech.unlocks.items?.includes(filter.unlocksItem!) ||
        tech.unlocks.recipes?.includes(filter.unlocksItem!) ||
        tech.unlocks.buildings?.includes(filter.unlocksItem!)
      );
    }

    return results;
  }

  /**
   * 获取科技的直接前置
   */
  getTechPrerequisites(techId: string): string[] {
    const tech = this.techTree.get(techId);
    return tech?.prerequisites || [];
  }

  /**
   * 获取依赖于指定科技的所有科技
   */
  getTechDependents(techId: string): string[] {
    if (this.dependentsCache.has(techId)) {
      return this.dependentsCache.get(techId)!;
    }

    const dependents: string[] = [];
    
    for (const [id, tech] of this.techTree) {
      if (tech.prerequisites.includes(techId)) {
        dependents.push(id);
      }
    }

    this.dependentsCache.set(techId, dependents);
    return dependents;
  }

  /**
   * 获取科技的完整依赖链
   */
  getTechDependencyChain(techId: string): string[] {
    if (this.dependencyChainCache.has(techId)) {
      return this.dependencyChainCache.get(techId)!;
    }

    const chain: string[] = [];
    const visited = new Set<string>();

    const dfs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const tech = this.techTree.get(id);
      if (!tech) return;

      tech.prerequisites.forEach(prereqId => dfs(prereqId));
      chain.push(id);
    };

    dfs(techId);
    
    // 移除自身
    const result = chain.filter(id => id !== techId);
    this.dependencyChainCache.set(techId, result);
    
    return result;
  }

  /**
   * 获取所有科技分类
   */
  getTechCategories(): TechCategory[] {
    return [...this.techCategories];
  }

  /**
   * 获取特定分类信息
   */
  getTechCategory(categoryId: string): TechCategory | undefined {
    return this.techCategories.find(cat => cat.id === categoryId);
  }

  /**
   * 按依赖顺序排序科技
   */
  getTechnologiesInDependencyOrder(): Technology[] {
    const sorted: Technology[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (techId: string) => {
      if (visited.has(techId)) return;
      if (visiting.has(techId)) {
        console.warn(`Circular dependency detected involving ${techId}`);
        return;
      }

      visiting.add(techId);
      const tech = this.techTree.get(techId);
      
      if (tech) {
        // 先访问所有前置
        tech.prerequisites.forEach(prereqId => visit(prereqId));
        sorted.push(tech);
      }

      visiting.delete(techId);
      visited.add(techId);
    };

    // 访问所有科技
    for (const techId of this.techTree.keys()) {
      visit(techId);
    }

    return sorted;
  }

  /**
   * 验证科技树完整性
   */
  validateTechTree(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [techId, tech] of this.techTree) {
      // 检查前置科技是否存在
      for (const prereqId of tech.prerequisites) {
        if (!this.techTree.has(prereqId)) {
          errors.push(`Tech ${techId} has invalid prerequisite: ${prereqId}`);
        }
      }

      // 检查是否有循环依赖
      const chain = this.getTechDependencyChain(techId);
      if (chain.includes(techId)) {
        errors.push(`Circular dependency detected for tech: ${techId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 构建依赖关系缓存
   */
  private buildDependencyCache(): void {
    this.dependentsCache.clear();
    this.dependencyChainCache.clear();

    // 预计算所有科技的依赖关系
    for (const techId of this.techTree.keys()) {
      this.getTechDependents(techId);
      this.getTechDependencyChain(techId);
    }
  }

  /**
   * 获取科技树统计信息
   */
  getTechTreeStatistics(): {
    totalCount: number;
    categoryCounts: Record<string, number>;
    maxDependencyDepth: number;
    orphanTechs: string[]; // 没有前置也没有后续的科技
  } {
    const categoryCounts: Record<string, number> = {};
    const orphanTechs: string[] = [];
    let maxDepth = 0;

    for (const [techId, tech] of this.techTree) {
      // 统计分类
      categoryCounts[tech.category] = (categoryCounts[tech.category] || 0) + 1;

      // 计算依赖深度
      const chain = this.getTechDependencyChain(techId);
      maxDepth = Math.max(maxDepth, chain.length);

      // 查找孤立科技
      if (tech.prerequisites.length === 0 && this.getTechDependents(techId).length === 0) {
        orphanTechs.push(techId);
      }
    }

    return {
      totalCount: this.techTree.size,
      categoryCounts,
      maxDependencyDepth: maxDepth,
      orphanTechs
    };
  }
}