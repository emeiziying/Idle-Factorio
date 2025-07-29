import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { saveOptimizationService } from '../services/SaveOptimizationService';
import { Box, Button, Card, CardContent, Typography, LinearProgress, Alert, Divider, Paper } from '@mui/material';
import { Save as SaveIcon, Compress as CompressIcon, Info as InfoIcon } from '@mui/icons-material';

export const SaveOptimizationTest: React.FC = () => {
  const gameState = useGameStore();
  const [optimizationResult, setOptimizationResult] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressedSize: number;
    reduction: number;
    percentage: number;
    compressionReduction: number;
    compressionPercentage: number;
  } | null>(null);

  const handleOptimize = () => {
    // 创建原始格式的数据
    const original = {
      inventory: Array.from(gameState.inventory.entries()),
      craftingQueue: gameState.craftingQueue,
      craftingChains: gameState.craftingChains,
      facilities: gameState.facilities,
      deployedContainers: gameState.deployedContainers,
      totalItemsProduced: gameState.totalItemsProduced,
      favoriteRecipes: Array.from(gameState.favoriteRecipes),
      recentRecipes: gameState.recentRecipes,
      researchState: gameState.researchState,
      researchQueue: gameState.researchQueue,
      unlockedTechs: Array.from(gameState.unlockedTechs),
      autoResearch: gameState.autoResearch,
      craftedItemCounts: Array.from(gameState.craftedItemCounts.entries()),
      builtEntityCounts: Array.from(gameState.builtEntityCounts.entries()),
      minedEntityCounts: Array.from(gameState.minedEntityCounts.entries()),
      lastSaveTime: Date.now(),
      saveKey: `test_${Date.now()}`
    };

    // 创建优化后的数据
    const optimized = saveOptimizationService.optimize(gameState);

    // 比较大小
    const result = saveOptimizationService.compareSizes(original, optimized);

    setOptimizationResult(result);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    return kb.toFixed(2) + ' KB';
  };

  return (
    <Box sx={{ padding: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompressIcon /> 存档优化测试
      </Typography>
      
      <Alert 
        severity="info" 
        sx={{ mb: 3 }}
      >
        第一阶段优化通过移除冗余字段、降低数值精度和简化数据结构来减少存档大小。
        第二阶段使用LZ-String压缩进一步减少存储空间。
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<SaveIcon />}
          onClick={handleOptimize}
          sx={{ alignSelf: 'flex-start' }}
        >
          测试存档优化
        </Button>

        {optimizationResult && (
          <>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>优化结果</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Paper elevation={0} sx={{ p: 2, flex: '1 1 200px', textAlign: 'center', bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">原始大小</Typography>
                    <Typography variant="h6" color="error.main">
                      {formatBytes(optimizationResult.originalSize)}
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2, flex: '1 1 200px', textAlign: 'center', bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">优化后大小</Typography>
                    <Typography variant="h6" color="warning.main">
                      {formatBytes(optimizationResult.optimizedSize)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      减少 {optimizationResult.percentage}%
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2, flex: '1 1 200px', textAlign: 'center', bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">压缩后大小</Typography>
                    <Typography variant="h6" color="success.main">
                      {formatBytes(optimizationResult.compressedSize)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      减少 {optimizationResult.compressionPercentage}%
                    </Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2, flex: '1 1 200px', textAlign: 'center', bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">总压缩率</Typography>
                    <Typography variant="h6" color="info.main">
                      {optimizationResult.compressionPercentage}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      节省 {formatBytes(optimizationResult.compressionReduction)}
                    </Typography>
                  </Paper>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    优化进度
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={optimizationResult.percentage} 
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    color="warning"
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    压缩进度
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={optimizationResult.compressionPercentage} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">详细对比</Typography>
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>主要优化项目：</Typography>
                <Box component="ul" sx={{ mt: 1, mb: 3 }}>
                  <li>
                    <Typography variant="body2">
                      <strong>库存系统：</strong> 从每个物品9个字段减少到只存储数量（减少约89%）
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>设施数据：</strong> 降低进度精度从15位小数到2位，简化燃料存储
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>数据结构：</strong> 使用简单对象代替Map结构，使用数组代替复杂对象
                    </Typography>
                  </li>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>存档优化效果展示</Typography>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="warning">
                    <strong>第一阶段优化：</strong>存档大小减少了 <strong>{optimizationResult.percentage}%</strong>，
                    从 <strong>{formatBytes(optimizationResult.originalSize)}</strong> 减少到 
                    <strong> {formatBytes(optimizationResult.optimizedSize)}</strong>
                  </Alert>
                  <Alert severity="success">
                    <strong>第二阶段压缩：</strong>最终存档大小减少了 <strong>{optimizationResult.compressionPercentage}%</strong>，
                    压缩后仅为 <strong>{formatBytes(optimizationResult.compressedSize)}</strong>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
};