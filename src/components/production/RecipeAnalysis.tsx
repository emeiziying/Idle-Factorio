import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import type { Recipe } from '../../types';
import DataService from '../../services/DataService';
import {
  getRecipeDependencyChain,
  getRecipeCostAnalysis,
  getItemProductionAnalysis
} from '../../utils/customRecipeUtils';

interface RecipeAnalysisProps {
  itemId: string;
  unlockedItems?: string[];
}

const RecipeAnalysis: React.FC<RecipeAnalysisProps> = ({ 
  itemId, 
  unlockedItems = [] 
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const dataService = DataService.getInstance();

  // 获取分析数据
  const productionAnalysis = getItemProductionAnalysis(itemId, unlockedItems);
  const recipes = productionAnalysis.recommendations;
  const enhancedStats = productionAnalysis.enhancedStats;
  const optimalPath = productionAnalysis.optimalPath;

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const renderRecipeCard = (recipe: Recipe) => {
    const costAnalysis = getRecipeCostAnalysis(recipe);
    const dependencyChain = getRecipeDependencyChain(recipe);
    
    return (
      <Paper key={recipe.id} sx={{ p: 2, mb: 2, cursor: 'pointer' }}
        onClick={() => handleRecipeSelect(recipe)}
        elevation={selectedRecipe?.id === recipe.id ? 4 : 1}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {dataService.getLocalizedRecipeName(recipe.id)}
            </Typography>
            <Chip 
              label={`效率: ${costAnalysis.efficiency.toFixed(2)}/秒`}
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`复杂度: ${costAnalysis.complexity.toFixed(1)}`}
              color="secondary"
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`依赖深度: ${dependencyChain.depth}`}
              color="info"
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                制作时间: {recipe.time}秒
              </Typography>
              <Typography variant="body2" color="text.secondary">
                直接成本: {Object.keys(costAnalysis.cost.directCost).length}种材料
              </Typography>
              <Typography variant="body2" color="text.secondary">
                总成本: {Object.keys(costAnalysis.cost.totalCost).length}种材料
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                产出: {recipe.out?.[itemId] || 0} {itemId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                原材料: {Object.keys(costAnalysis.cost.rawMaterials).length}种
              </Typography>
              <Typography variant="body2" color="text.secondary">
                成本效率比: {costAnalysis.costEfficiencyRatio.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderDependencyChain = (recipe: Recipe) => {
    const dependencyChain = getRecipeDependencyChain(recipe);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          依赖链分析
        </Typography>
        <Typography variant="body2" color="text.secondary">
          最大深度: {dependencyChain.depth}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          依赖物品: {dependencyChain.dependencies.size}种
        </Typography>
        <Typography variant="body2" color="text.secondary">
          总成本物品: {dependencyChain.totalCost.size}种
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            依赖物品列表:
          </Typography>
          {Array.from(dependencyChain.dependencies.entries()).map(([itemId, depth]) => (
            <Chip
              key={itemId}
              label={`${dataService.getLocalizedItemName(itemId)} (深度${depth})`}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  const renderOptimalPath = () => {
    if (optimalPath.path.length === 0) {
      return (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            最优生产路径
          </Typography>
          <Typography color="text.secondary">
            暂无可用配方
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          最优生产路径
        </Typography>
        <Typography variant="body2" color="text.secondary">
          总时间: {optimalPath.totalTime}秒
        </Typography>
        <Typography variant="body2" color="text.secondary">
          效率: {optimalPath.efficiency.toFixed(2)}/秒
        </Typography>
        <Typography variant="body2" color="text.secondary">
          成本物品: {optimalPath.totalCost.size}种
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            路径配方:
          </Typography>
          {optimalPath.path.map((recipe, index) => (
            <Chip
              key={recipe.id}
              label={`${index + 1}. ${dataService.getLocalizedRecipeName(recipe.id)}`}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </Paper>
    );
  };

  const renderEnhancedStats = () => {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          增强统计信息
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              总配方数: {enhancedStats.totalRecipes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              可用配方: {enhancedStats.availableRecipes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              手动配方: {enhancedStats.manualRecipes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              自动化配方: {enhancedStats.automatedRecipes}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              采矿配方: {enhancedStats.miningRecipes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              回收配方: {enhancedStats.recyclingRecipes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              依赖深度: {enhancedStats.dependencyDepth}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              平均效率: {enhancedStats.averageEfficiency.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        
        {enhancedStats.fastestRecipe && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              最快配方: {dataService.getLocalizedRecipeName(enhancedStats.fastestRecipe.id)}
            </Typography>
          </Box>
        )}
        
        {enhancedStats.cheapestRecipe && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              最便宜配方: {dataService.getLocalizedRecipeName(enhancedStats.cheapestRecipe.id)}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {dataService.getLocalizedItemName(itemId)} - 配方分析
      </Typography>
      
      {renderEnhancedStats()}
      {renderOptimalPath()}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        推荐配方 ({recipes.length})
      </Typography>
      
      {recipes.map((recipe) => renderRecipeCard(recipe))}
      
      {selectedRecipe && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            详细分析: {dataService.getLocalizedRecipeName(selectedRecipe.id)}
          </Typography>
          {renderDependencyChain(selectedRecipe)}
        </Box>
      )}
    </Box>
  );
};

export default RecipeAnalysis; 