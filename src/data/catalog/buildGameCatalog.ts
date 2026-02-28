import type { Category, GameData, Item, Recipe } from '@/types';
import type { Technology } from '@/types/technology';

import type { GameCatalog } from '@/data/catalog/GameCatalog';

export const buildGameCatalog = (data: GameData): GameCatalog => {
  const itemsById = new Map<string, Item>();
  const recipesById = new Map<string, Recipe>();
  const recipesByOutput = new Map<string, Recipe[]>();
  const categoriesById = new Map<string, Category>();
  const technologiesById = new Map<string, Technology>();

  data.items.forEach(item => {
    itemsById.set(item.id, item);
  });

  data.recipes.forEach(recipe => {
    recipesById.set(recipe.id, recipe);
    Object.keys(recipe.out || {}).forEach(itemId => {
      const recipes = recipesByOutput.get(itemId) || [];
      recipes.push(recipe);
      recipesByOutput.set(itemId, recipes);
    });
  });

  data.categories.forEach(category => {
    categoriesById.set(category.id, category);
  });

  const technologiesInOrder = buildTechnologyCatalog(data, recipesById);
  technologiesInOrder.forEach(technology => {
    technologiesById.set(technology.id, technology);
  });

  return {
    data,
    itemsById,
    recipesById,
    recipesByOutput,
    categoriesById,
    technologiesById,
    technologiesInOrder,
  };
};

const buildTechnologyCatalog = (
  data: GameData,
  recipesById: ReadonlyMap<string, Recipe>
): Technology[] => {
  const technologies = data.recipes
    .filter(recipe => recipe.category === 'technology')
    .map(parseTechnologyRecipe);
  const technologyMap = new Map<string, Technology>();

  technologies.forEach(technology => {
    technologyMap.set(technology.id, technology);
  });

  data.items.forEach(item => {
    const technology = technologyMap.get(item.id);
    if (!technology || !item.technology) {
      return;
    }

    technology.prerequisites = (item.technology.prerequisites || []).filter(prerequisite =>
      technologyMap.has(prerequisite)
    );

    if (item.technology.unlockedRecipes?.length) {
      technology.unlocks.recipes = item.technology.unlockedRecipes;

      const unlockedItems = new Set<string>();
      item.technology.unlockedRecipes.forEach(recipeId => {
        const unlockedRecipe = recipesById.get(recipeId);
        if (!unlockedRecipe) {
          return;
        }

        Object.keys(unlockedRecipe.out || {}).forEach(itemId => {
          unlockedItems.add(itemId);
        });
      });
      technology.unlocks.items = Array.from(unlockedItems);
    }
  });

  return technologies;
};

const parseTechnologyRecipe = (recipe: Recipe): Technology => {
  const researchCost = Object.fromEntries(
    Object.entries(recipe.in || {}).filter(([itemId]) => isSciencePack(itemId))
  );
  const researchUnits = recipe.count && recipe.count > 0 ? recipe.count : 1;
  const researchTimeSeconds = (recipe.time || 60) * researchUnits;

  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    row: recipe.row || 0,
    prerequisites: [],
    researchCost,
    researchTime: researchTimeSeconds,
    researchUnits,
    unlocks: {
      items: [],
      recipes: [],
      buildings: [],
    },
    researchTrigger: recipe.researchTrigger,
    position: {
      x: 0,
      y: recipe.row || 0,
    },
  };
};

const isSciencePack = (itemId: string): boolean => {
  return (
    itemId.includes('science-pack') ||
    itemId === 'automation-science-pack' ||
    itemId === 'logistic-science-pack' ||
    itemId === 'military-science-pack' ||
    itemId === 'chemical-science-pack' ||
    itemId === 'production-science-pack' ||
    itemId === 'utility-science-pack' ||
    itemId === 'space-science-pack'
  );
};
