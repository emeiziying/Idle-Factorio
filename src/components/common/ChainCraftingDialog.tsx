import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { Warning as WarningIcon, Build as BuildIcon } from '@mui/icons-material';
import FactorioIcon from '@/components/common/FactorioIcon';
import { DataService } from '@/services/core/DataService';
import type {
  CraftingChainAnalysis,
  CraftingDependency,
} from '@/services/crafting/DependencyService';
import type { CraftingTask } from '@/types';

interface ChainCraftingDialogProps {
  open: boolean;
  chain: CraftingChainAnalysis | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ChainCraftingDialog: React.FC<ChainCraftingDialogProps> = ({
  open,
  chain,
  onConfirm,
  onCancel,
}) => {
  const dataService = DataService.getInstance();

  if (!chain) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}秒`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.ceil(seconds % 60);
      return `${minutes}分${remainingSeconds}秒`;
    }
  };

  // 计算总预计时间
  const totalDuration = chain.tasks.reduce((total: number, task: CraftingTask) => {
    const baseTime = task.craftingTime || 1;
    const manualEfficiency = 0.5;
    const actualTime = baseTime / manualEfficiency;
    return total + actualTime * task.quantity;
  }, 0);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
        }}
      >
        <WarningIcon color="warning" />
        <Box component="span">材料不足 - 创建制作链？</Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            制作{' '}
            <strong>
              {dataService.getLocalizedItemName(chain.mainTask.itemId)} x{chain.mainTask.quantity}
            </strong>{' '}
            需要以下材料：
          </Typography>
        </Box>

        {/* 缺少的材料列表 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            缺少材料：
          </Typography>
          <List dense>
            {chain.dependencies.map((dep: CraftingDependency) => (
              <ListItem key={dep.itemId} sx={{ px: 0 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <FactorioIcon itemId={dep.itemId} size={32} showBorder={false} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {dataService.getLocalizedItemName(dep.itemId)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`缺少 ${dep.shortage}`}
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" component="span">
                      需要 {dep.required} | 拥有 {dep.available}
                      {dep.canCraftManually ? ' | 可手动制作' : ' | 无法制作'}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 制作计划 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            制作计划：
          </Typography>
          <List dense>
            {chain.tasks.map((task: CraftingTask, taskIndex: number) => {
              const isMainTask = taskIndex === chain.tasks.length - 1;
              return (
                <ListItem key={task.id} sx={{ px: 0 }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <FactorioIcon
                      itemId={task.itemId}
                      size={32}
                      quantity={task.quantity}
                      showBorder={false}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isMainTask ? 600 : 400,
                            color: isMainTask ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {dataService.getLocalizedItemName(task.itemId)} x{task.quantity}
                        </Typography>
                        {isMainTask && (
                          <Chip size="small" label="目标" color="primary" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" component="span">
                        {formatTime(((task.craftingTime || 1) / 0.5) * task.quantity)}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* 总结信息 */}
        <Box
          sx={{
            bgcolor: 'background.default',
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <BuildIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              制作摘要
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            • 总任务数：{chain.tasks.length} 个<br />• 预计时间：{formatTime(totalDuration)}
            <br />• 所有材料均可手动制作
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit">
          取消
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary" startIcon={<BuildIcon />}>
          开始制作链
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChainCraftingDialog;
