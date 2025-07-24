import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import DataService from '../../services/DataService';

interface UsageCardProps {
  usedInRecipes: Recipe[];
}

const UsageCard: React.FC<UsageCardProps> = ({ usedInRecipes }) => {
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  if (usedInRecipes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          用于制作
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {usedInRecipes.map((recipe) => {
            const outputItemId = Object.keys(recipe.out)[0];
            return (
              <Chip
                key={recipe.id}
                icon={<FactorioIcon itemId={outputItemId} size={16} />}
                label={getLocalizedItemName(outputItemId)}
                size="small"
                variant="outlined"
              />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UsageCard; 