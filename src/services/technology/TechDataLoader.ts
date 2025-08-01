/**
 * 科技数据加载服务
 * 负责从 data.json 加载和解析科技数据
 */

import type { Technology, TechCategory } from '@/types/technology';
import type { TechRecipe, TechItem } from '@/services/technology/types';
import { DataService } from '@/services/core/DataService';
import { RecipeService } from '@/services/crafting/RecipeService';

export class TechDataLoader {
  private dataService: DataService;

  constructor() {
    this.dataService = DataService.getInstance();
  }

  /**
   * 从 data.json 加载所有科技数据
   */
  async loadTechnologiesFromDataJson(): Promise<{ 
    technologies: Technology[]; 
    techOrder: string[] 
  }> {
    const technologies: Technology[] = [];
    const techOrder: string[] = [];
    
    // 获取所有科技配方
    const techRecipes = this.dataService.getTechnologies();
    
    for (const recipe of techRecipes) {
      const techRecipe: TechRecipe = {
        ...recipe,
        row: recipe.row || 0
      };
      const tech = this.parseTechRecipe(techRecipe);
      technologies.push(tech);
      techOrder.push(tech.id);
    }

    // 加载额外的技术解锁信息
    const items = this.dataService.getAllItems();
    this.enrichTechnologiesWithItemData(technologies, items);

    return { technologies, techOrder };
  }

  /**
   * 加载科技分类数据
   */
  async loadTechCategoriesFromDataJson(): Promise<TechCategory[]> {
    const categories: TechCategory[] = [];
    const categoryMap = new Map<string, Set<string>>();

    // 从科技配方中收集分类信息
    const techRecipes = this.dataService.getTechnologies();
    
    for (const recipe of techRecipes) {
      if (!categoryMap.has(recipe.category)) {
        categoryMap.set(recipe.category, new Set());
      }
      categoryMap.get(recipe.category)!.add(recipe.id);
    }

    // 转换为 TechCategory 格式
    for (const [categoryId, techIds] of categoryMap) {
      categories.push({
        id: categoryId,
        name: this.getCategoryDisplayName(categoryId),
        technologies: Array.from(techIds),
        color: this.getCategoryColor(categoryId),
        description: this.getCategoryDescription(categoryId),
        icon: 'default-tech-icon', // TODO: 从配置获取图标
        order: 0 // TODO: 从配置获取排序
      });
    }

    return categories;
  }

  /**
   * 解析单个科技配方
   */
  private parseTechRecipe(recipe: TechRecipe): Technology {
    const tech: Technology = {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      row: recipe.row || 0,
      prerequisites: [],
      researchCost: this.calculateResearchCostFromRecipe(recipe),
      researchTime: this.calculateResearchTimeFromRecipe(recipe),
      unlocks: {
        items: [],
        recipes: [],
        buildings: [],
      },
      researchTrigger: recipe.researchTrigger,
      position: {
        x: 0, // TODO: 从配置或算法计算实际位置
        y: recipe.row || 0
      }
    };

    return tech;
  }

  /**
   * 计算科技研究成本
   */
  private calculateResearchCostFromRecipe(techRecipe: TechRecipe): Record<string, number> {
    const cost: Record<string, number> = {};
    
    // 输入物品就是科技瓶需求
    for (const [itemId, amount] of Object.entries(techRecipe.in)) {
      // 只包含科技瓶类物品
      if (this.isSciencePack(itemId)) {
        cost[itemId] = amount;
      }
    }

    // 如果有 count 属性，需要乘以数量
    if (techRecipe.count && techRecipe.count > 1) {
      for (const itemId in cost) {
        cost[itemId] *= techRecipe.count;
      }
    }

    return cost;
  }

  /**
   * 计算科技研究时间
   */
  private calculateResearchTimeFromRecipe(techRecipe: TechRecipe): number {
    // 使用配方的 time 字段，如果没有则默认 60 秒
    let baseTime = techRecipe.time || 60;

    // 如果有 count 属性，需要乘以数量
    if (techRecipe.count && techRecipe.count > 1) {
      baseTime *= techRecipe.count;
    }

    return baseTime;
  }

  /**
   * 使用物品数据丰富科技信息
   */
  private enrichTechnologiesWithItemData(technologies: Technology[], items: TechItem[]): void {
    // 创建科技映射
    const techMap = new Map<string, Technology>();
    technologies.forEach(tech => techMap.set(tech.id, tech));

    // 遍历物品，提取科技解锁信息
    for (const item of items) {
      if (item.technology) {
        // 处理前置科技
        if (item.technology.prerequisites) {
          const tech = techMap.get(item.id);
          if (tech) {
            tech.prerequisites = item.technology.prerequisites;
          }
        }

        // 处理解锁的配方
        if (item.technology.unlockedRecipes) {
          const tech = techMap.get(item.id);
          if (tech) {
            tech.unlocks.recipes = item.technology.unlockedRecipes;
            
            // 同时收集解锁的物品（从配方输出推断）
            const unlockedItems = new Set<string>();
            for (const recipeId of item.technology.unlockedRecipes) {
              const recipe = RecipeService.getRecipeById(recipeId);
              if (recipe) {
                Object.keys(recipe.out).forEach(itemId => unlockedItems.add(itemId));
              }
            }
            tech.unlocks.items = Array.from(unlockedItems);
          }
        }
      }
    }

    // 处理依赖关系，确保前置科技正确
    this.validateAndFixPrerequisites(technologies);
  }

  /**
   * 验证并修复前置科技关系
   */
  private validateAndFixPrerequisites(technologies: Technology[]): void {
    const techIds = new Set(technologies.map(t => t.id));
    
    for (const tech of technologies) {
      // 过滤掉不存在的前置科技
      tech.prerequisites = tech.prerequisites.filter((prereqId: string) => techIds.has(prereqId));
    }
  }

  /**
   * 判断物品是否为科技瓶
   */
  private isSciencePack(itemId: string): boolean {
    return itemId.includes('science-pack') || 
           itemId === 'automation-science-pack' ||
           itemId === 'logistic-science-pack' ||
           itemId === 'military-science-pack' ||
           itemId === 'chemical-science-pack' ||
           itemId === 'production-science-pack' ||
           itemId === 'utility-science-pack' ||
           itemId === 'space-science-pack';
  }

  /**
   * 获取分类显示名称
   */
  private getCategoryDisplayName(categoryId: string): string {
    const nameMap: Record<string, string> = {
      'technology': '科技',
      'military': '军事',
      'production': '生产',
      'logistics': '物流',
      // 添加更多映射
    };
    return nameMap[categoryId] || categoryId;
  }

  /**
   * 获取分类颜色
   */
  private getCategoryColor(categoryId: string): string {
    const colorMap: Record<string, string> = {
      'technology': '#4A90E2',
      'military': '#E74C3C',
      'production': '#F39C12',
      'logistics': '#27AE60',
      // 添加更多映射
    };
    return colorMap[categoryId] || '#7F8C8D';
  }

  /**
   * 获取分类描述
   */
  private getCategoryDescription(categoryId: string): string {
    const descriptionMap: Record<string, string> = {
      'technology': '基础科技研究',
      'military': '军事科技与武器',
      'production': '生产效率提升',
      'logistics': '物流与运输优化',
      // 添加更多映射
    };
    return descriptionMap[categoryId] || '';
  }
}