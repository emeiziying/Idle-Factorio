import React from 'react';
import {
  Typography,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import type { Recipe } from '../../types/index';
import FactorioIcon from '../common/FactorioIcon';
import { DataService } from '../../services/DataService';

interface UsageCardProps {
  usedInRecipes: Recipe[];
}

const UsageCard: React.FC<UsageCardProps> = ({ usedInRecipes }) => {
  const theme = useTheme();
  const dataService = DataService.getInstance();

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  if (usedInRecipes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ 
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'text.primary',
        mb: 1
      }}>
        用于制作
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {usedInRecipes.map((recipe) => {
          const outputItemId = Object.keys(recipe.out)[0];
          return (
            <Chip
              key={recipe.id}
              icon={<FactorioIcon itemId={outputItemId} size={16} />}
              label={getLocalizedItemName(outputItemId)}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default UsageCard; 