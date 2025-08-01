import React from 'react';
import { Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useIsMobile } from '@/hooks/useIsMobile';

interface CraftingButtonsProps {
  onCraft: (quantity: number) => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined';
}

const CraftingButtons: React.FC<CraftingButtonsProps> = ({
  onCraft,
  disabled = false,
  variant = 'contained',
}) => {
  const isMobile = useIsMobile();

  return (
    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
      <Button
        size={isMobile ? 'medium' : 'small'}
        variant={variant}
        startIcon={<AddIcon />}
        onClick={() => onCraft(1)}
        disabled={disabled}
        sx={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          minWidth: 'auto',
          px: isMobile ? 1 : 1.5,
        }}
      >
        x1
      </Button>
      <Button
        size={isMobile ? 'medium' : 'small'}
        variant={variant}
        startIcon={<AddIcon />}
        onClick={() => onCraft(5)}
        disabled={disabled}
        sx={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          minWidth: 'auto',
          px: isMobile ? 1 : 1.5,
        }}
      >
        x5
      </Button>
    </Box>
  );
};

export default CraftingButtons;
