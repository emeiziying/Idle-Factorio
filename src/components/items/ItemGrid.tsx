import React from 'react';
import { Grid, Paper, Typography, Box, Badge } from '@mui/material';
import type { Item } from '../../types';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { selectItem } from '../../store/slices/uiSlice';
import { formatNumber } from '../../utils/format';

interface ItemGridProps {
  items: Item[];
}

export const ItemGrid: React.FC<ItemGridProps> = ({ items }) => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector(state => state.inventory.stocks);
  const productionRates = useAppSelector(state => state.production.rates);
  
  const handleItemClick = (itemId: string) => {
    dispatch(selectItem(itemId));
  };
  
  return (
    <Grid container spacing={2}>
      {items.map(item => {
        const stock = inventory[item.id] || 0;
        const rate = productionRates[item.id];
        const hasProduction = rate && (rate.production > 0 || rate.consumption > 0);
        
        return (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
            <Paper
              sx={{
                p: 2,
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleItemClick(item.id)}
            >
              <Badge
                badgeContent={hasProduction ? '⚙️' : null}
                invisible={!hasProduction}
                overlap="circular"
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  {/* 这里应该显示图标，暂时用文字代替 */}
                  <Typography variant="h6">
                    {item.name.charAt(0)}
                  </Typography>
                </Box>
              </Badge>
              
              <Typography variant="body2" align="center" gutterBottom>
                {item.name}
              </Typography>
              
              <Typography variant="h6" color="primary">
                {formatNumber(stock)}
              </Typography>
              
              {rate && rate.net !== 0 && (
                <Typography
                  variant="caption"
                  color={rate.net > 0 ? 'success.main' : 'error.main'}
                >
                  {rate.net > 0 ? '+' : ''}{formatNumber(rate.net)}/s
                </Typography>
              )}
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};