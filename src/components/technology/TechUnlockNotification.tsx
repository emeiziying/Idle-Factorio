// 科技解锁通知组件

import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  Slide,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  NewReleases as UnlockIcon,
  Build as RecipeIcon,
  Inventory as ItemIcon
} from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import type { Technology } from '../../types/technology';
import { DataService } from '../../services/DataService';

interface TechUnlockEvent {
  techId: string;
  technology: Technology;
  unlockedItems: string[];
  unlockedRecipes: string[];
  unlockedBuildings: string[];
  timestamp: number;
}

interface TechUnlockNotificationProps {
  /** 解锁事件 */
  unlockEvent: TechUnlockEvent | null;
  
  /** 关闭通知的回调 */
  onClose: () => void;
  
  /** 自动关闭延迟（毫秒） */
  autoHideDuration?: number;
  
  /** 通知位置 */
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const TechUnlockNotification: React.FC<TechUnlockNotificationProps> = ({
  unlockEvent,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'right' }
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const dataService = DataService.getInstance();

  useEffect(() => {
    if (unlockEvent) {
      setOpen(true);
    }
  }, [unlockEvent]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 200); // 等待动画完成
  };

  if (!unlockEvent) return null;

  const { technology, unlockedItems, unlockedRecipes, unlockedBuildings } = unlockEvent;

  // 获取解锁内容的详细信息
  const getUnlockDetails = () => {
    const details = {
      items: unlockedItems.map(itemId => ({
        id: itemId,
        name: dataService.getItem(itemId)?.name || itemId
      })),
      recipes: unlockedRecipes.map(recipeId => ({
        id: recipeId,
        name: dataService.getRecipe(recipeId)?.name || recipeId
      })),
      buildings: unlockedBuildings.map(buildingId => ({
        id: buildingId,
        name: dataService.getItem(buildingId)?.name || buildingId
      }))
    };

    return details;
  };

  const unlockDetails = getUnlockDetails();
  const totalUnlocks = unlockedItems.length + unlockedRecipes.length + unlockedBuildings.length;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      TransitionComponent={Slide}
    >
      <Alert
        severity="success"
        onClose={handleClose}
        variant="filled"
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: alpha(theme.palette.success.main, 0.95),
          color: theme.palette.success.contrastText,
          '& .MuiAlert-icon': {
            color: theme.palette.success.contrastText
          },
          '& .MuiAlert-action': {
            color: theme.palette.success.contrastText
          }
        }}
        icon={<ScienceIcon />}
        action={
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: theme.palette.success.contrastText }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          {/* 标题 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FactorioIcon
              itemId={technology.icon || technology.id}
              size={24}
              showBorder={false}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              科技解锁：{technology.name}
            </Typography>
            <UnlockIcon fontSize="small" />
          </Box>

          {/* 解锁统计 */}
          <Box sx={{ mb: 1 }}>
            <Chip
              label={`${totalUnlocks} 项新内容`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.success.contrastText, 0.2),
                color: theme.palette.success.contrastText,
                fontWeight: 600
              }}
            />
          </Box>

          {/* 解锁物品 */}
          {unlockDetails.items.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <ItemIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  新物品 ({unlockDetails.items.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {unlockDetails.items.slice(0, 3).map(item => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.5,
                      py: 0.25,
                      bgcolor: alpha(theme.palette.success.contrastText, 0.15),
                      borderRadius: 0.5
                    }}
                  >
                    <FactorioIcon
                      itemId={item.id}
                      size={16}
                      showBorder={false}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      {item.name}
                    </Typography>
                  </Box>
                ))}
                {unlockDetails.items.length > 3 && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    +{unlockDetails.items.length - 3} 更多...
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* 解锁配方 */}
          {unlockDetails.recipes.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RecipeIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  新配方 ({unlockDetails.recipes.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {unlockDetails.recipes.slice(0, 2).map(recipe => (
                  <Typography
                    key={recipe.id}
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      px: 0.5,
                      py: 0.25,
                      bgcolor: alpha(theme.palette.success.contrastText, 0.15),
                      borderRadius: 0.5
                    }}
                  >
                    {recipe.name}
                  </Typography>
                ))}
                {unlockDetails.recipes.length > 2 && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    +{unlockDetails.recipes.length - 2} 更多...
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* 解锁建筑 */}
          {unlockDetails.buildings.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RecipeIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  新建筑 ({unlockDetails.buildings.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {unlockDetails.buildings.map(building => (
                  <Box
                    key={building.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.5,
                      py: 0.25,
                      bgcolor: alpha(theme.palette.success.contrastText, 0.15),
                      borderRadius: 0.5
                    }}
                  >
                    <FactorioIcon
                      itemId={building.id}
                      size={16}
                      showBorder={false}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      {building.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default TechUnlockNotification;