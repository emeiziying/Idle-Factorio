import React, { useState } from 'react';
import type { Recipe } from '@/types';
import useGameStore from '@/store/gameStore';
import { DataService } from '@/services/core/DataService';

interface RecipeInfoProps {
  itemId: string;
  onRecipeSelect?: (recipe: Recipe) => void;
}

const RecipeInfo: React.FC<RecipeInfoProps> = ({ itemId, onRecipeSelect }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');

  const {
    getRecommendedRecipes,
    getRecipeStats,
    addFavoriteRecipe,
    removeFavoriteRecipe,
    isFavoriteRecipe,
    addRecentRecipe,
  } = useGameStore();

  const dataService = DataService.getInstance();
  const item = dataService.getItem(itemId);
  const recipes = getRecommendedRecipes(itemId);
  const stats = getRecipeStats(itemId);

  if (!item) {
    return <div className="p-4 text-gray-500">物品不存在</div>;
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    addRecentRecipe(recipe.id);
    onRecipeSelect?.(recipe);
  };

  const handleFavoriteToggle = (recipeId: string) => {
    if (isFavoriteRecipe(recipeId)) {
      removeFavoriteRecipe(recipeId);
    } else {
      addFavoriteRecipe(recipeId);
    }
  };

  const getEfficiency = (recipe: Recipe) => {
    const output = recipe.out?.[itemId] || 0;
    const time = recipe.time || 1;
    return (output / time).toFixed(2);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* 物品信息 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {dataService.getLocalizedItemName(itemId)}
        </h3>
        <p className="text-sm text-gray-600">ID: {itemId}</p>
      </div>

      {/* 配方统计 */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h4 className="text-sm font-medium text-gray-700 mb-2">配方统计</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>总配方数: {stats.totalRecipes}</div>
          <div>手动采集: {stats.manualRecipes}</div>
          <div>自动化: {stats.automatedRecipes}</div>
          <div>采矿: {stats.miningRecipes}</div>
          <div>回收: {stats.recyclingRecipes}</div>
          {stats.mostEfficientRecipe && (
            <div className="col-span-2 text-green-600">
              最高效率: {dataService.getLocalizedRecipeName(stats.mostEfficientRecipe.id)}
            </div>
          )}
        </div>
      </div>

      {/* 配方列表 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">推荐配方</h4>
        {recipes.length === 0 ? (
          <p className="text-sm text-gray-500">暂无配方</p>
        ) : (
          recipes.map(recipe => (
            <div
              key={recipe.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedRecipeId === recipe.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRecipeClick(recipe)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {dataService.getLocalizedRecipeName(recipe.id)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {recipe.category || '制造'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    产出: {recipe.out?.[itemId] || 0} {itemId} / {recipe.time}秒 (效率:{' '}
                    {getEfficiency(recipe)} {itemId}/秒)
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleFavoriteToggle(recipe.id);
                  }}
                  className={`ml-2 p-1 rounded ${
                    isFavoriteRecipe(recipe.id)
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  ★
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 配方详情 */}
      {selectedRecipeId && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="text-sm font-medium text-gray-700 mb-2">配方详情</h4>
          {(() => {
            const recipe = recipes.find(r => r.id === selectedRecipeId);
            if (!recipe) return null;

            return (
              <div className="text-xs space-y-1">
                <div>配方ID: {recipe.id}</div>
                <div>分类: {recipe.category}</div>
                <div>时间: {recipe.time}秒</div>
                <div>标志: {recipe.flags?.join(', ') || '无'}</div>
                {recipe.cost !== undefined && <div>成本: {recipe.cost}</div>}
                {recipe.locations && recipe.locations.length > 0 && (
                  <div>位置: {recipe.locations.join(', ')}</div>
                )}
                {recipe.producers && recipe.producers.length > 0 && (
                  <div>生产者: {recipe.producers.join(', ')}</div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default RecipeInfo;
