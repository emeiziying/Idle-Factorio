import React from 'react';
import type { Recipe } from '../../types/index';
import UnifiedRecipeCard from './UnifiedRecipeCard';

interface ProducerRecipeCardProps {
  recipe: Recipe;
  onCraft: (recipe: Recipe, quantity: number) => void;
}

const ProducerRecipeCard: React.FC<ProducerRecipeCardProps> = ({ recipe, onCraft }) => {
  return (
    <UnifiedRecipeCard
      recipe={recipe}
      variant="producer"
      onCraft={onCraft}
      cardVariant="outlined"
    />
  );
};

export default ProducerRecipeCard;
