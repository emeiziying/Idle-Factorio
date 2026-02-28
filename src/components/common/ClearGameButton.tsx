import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import useGameStore from '@/store/gameStore';
import { useIsMobile } from '@/hooks/useIsMobile';

const ClearGameButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { clearGameData } = useGameStore();
  const isMobile = useIsMobile();

  const handleClearGame = async () => {
    setIsDialogOpen(false);
    await clearGameData();
  };

  return (
    <>
      <Fab
        color="error"
        size="small"
        aria-label="clear-game"
        sx={{
          position: 'fixed',
          bottom: '72px',
          right: '16px',
          zIndex: 1000,
          bgcolor: 'error.main',
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          '&:hover': {
            bgcolor: 'error.dark',
            transform: 'scale(1.1)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          transition: 'all 0.2s ease',
        }}
        onClick={() => setIsDialogOpen(true)}
      >
        <DeleteIcon />
      </Fab>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>确认清空存档</DialogTitle>
        <DialogContent>
          <Typography>您确定要清空所有游戏数据吗？这将删除所有已保存的进度和设置。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>取消</Button>
          <Button onClick={handleClearGame} color="error" variant="contained">
            清空存档
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClearGameButton;
