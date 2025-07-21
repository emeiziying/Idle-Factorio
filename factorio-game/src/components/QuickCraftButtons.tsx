import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';

interface QuickCraftButtonsProps {
  onSelectAmount: (amount: number) => void;
  currentAmount: number;
}

const QuickCraftButtons: React.FC<QuickCraftButtonsProps> = ({ 
  onSelectAmount, 
  currentAmount 
}) => {
  const quickAmounts = [1, 5, 10, 50, 100];

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <ButtonGroup 
        variant="outlined" 
        size="small" 
        fullWidth
        sx={{ 
          '& .MuiButton-root': { 
            minWidth: 0,
            flex: 1 
          } 
        }}
      >
        {quickAmounts.map(amount => (
          <Button
            key={amount}
            onClick={() => onSelectAmount(amount)}
            variant={currentAmount === amount ? 'contained' : 'outlined'}
            color={currentAmount === amount ? 'primary' : 'inherit'}
          >
            {amount}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
};

export default QuickCraftButtons;