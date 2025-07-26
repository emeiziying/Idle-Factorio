import React from 'react';
import {
  Card,
  CardContent,
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
    <Card sx={{ ...theme.customStyles.layout.cardCompact, bgcolor: 'transparent', boxShadow: 1 }}>
      <CardContent sx={{ p: theme.customStyles.spacing.compact }}>
        <Typography variant="subtitle2" gutterBottom sx={theme.customStyles.typography.subtitle}>
          用于制作
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={theme.customStyles.spacing.compact}>
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