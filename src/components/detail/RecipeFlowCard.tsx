import React from 'react';
import type { Recipe } from '@/types/index';
import UnifiedRecipeCard from './UnifiedRecipeCard';

interface RecipeFlowCardProps {
  recipe: Recipe;
  title?: string;
  onCraft: (recipe: Recipe, quantity: number) => void;
  variant?: 'contained' | 'outlined';
}

const RecipeFlowCard: React.FC<RecipeFlowCardProps> = ({ recipe, title, onCraft, variant = 'contained' }) => {
  return <UnifiedRecipeCard recipe={recipe} variant="normal" title={title} onCraft={onCraft} cardVariant={variant} />;
};

export default RecipeFlowCard;
