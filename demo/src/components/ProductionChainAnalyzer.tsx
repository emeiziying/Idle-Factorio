import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  styled,
  Collapse,
  IconButton,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Item, Recipe } from '../types';
import { dataService } from '../services/DataService';
import { facilityService } from '../services/FacilityService';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';

const ChainCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#f8f9fa',
}));

const ChainItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  backgroundColor: '#fff',
  marginBottom: theme.spacing(1),
  border: '1px solid #e0e0e0',
}));

const StatusChip = styled(Chip)<{ status: 'good' | 'warning' | 'error' }>(({ status }) => ({
  '& .MuiChip-icon': {
    color: status === 'good' ? '#4caf50' : status === 'warning' ? '#ff9800' : '#f44336',
  },
}));

interface ProductionNode {
  itemId: string;
  itemName: string;
  requiredRate: number;
  actualRate: number;
  efficiency: number;
  bottleneck: 'none' | 'production' | 'logistics' | 'resources';
  children: ProductionNode[];
  depth: number;
}

interface ProductionChainAnalyzerProps {
  itemId: string;
  targetRate?: number;
}

const ProductionChainAnalyzer: React.FC<ProductionChainAnalyzerProps> = ({
  itemId,
  targetRate = 1,
}) => {
  const [rootNode, setRootNode] = useState<ProductionNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeProductionChain();
  }, [itemId, targetRate]);

  const analyzeProductionChain = () => {
    setLoading(true);
    try {
      const node = buildProductionNode(itemId, targetRate, 0, new Set());
      setRootNode(node);
      
      // 默认展开前两层
      const toExpand = new Set<string>();
      const expandToDepth = (node: ProductionNode, maxDepth: number) => {
        if (node.depth < maxDepth) {
          toExpand.add(node.itemId);
          node.children.forEach(child => expandToDepth(child, maxDepth));
        }
      };
      if (node) {
        expandToDepth(node, 2);
      }
      setExpandedNodes(toExpand);
    } finally {
      setLoading(false);
    }
  };

  const buildProductionNode = (
    itemId: string,
    requiredRate: number,
    depth: number,
    visited: Set<string>
  ): ProductionNode => {
    // 避免循环依赖
    if (visited.has(itemId)) {
      return {
        itemId,
        itemName: itemId,
        requiredRate,
        actualRate: 0,
        efficiency: 0,
        bottleneck: 'error',
        children: [],
        depth,
      };
    }

    visited.add(itemId);

    const item = dataService.getGameData()?.items.find(i => i.id === itemId);
    const itemName = item?.name || itemId;
    
    // 获取生产信息
    const facilities = facilityService.getFacilitiesForItem(itemId);
    const totalProduction = facilityService.getTotalProductionForItem(itemId);
    const logistics = simpleLogisticsService.getFacilityLogistics(itemId);
    
    // 计算实际产量和效率
    let actualRate = totalProduction;
    let efficiency = 1;
    let bottleneck: ProductionNode['bottleneck'] = 'none';
    
    if (logistics) {
      actualRate = logistics.actualProductionRate;
      efficiency = logistics.efficiency;
      
      if (logistics.bottleneck === 'input') {
        bottleneck = 'logistics';
      } else if (logistics.bottleneck === 'output') {
        bottleneck = 'logistics';
      } else if (actualRate < requiredRate * 0.9) {
        bottleneck = 'production';
      }
    } else if (facilities.length === 0) {
      actualRate = 0;
      efficiency = 0;
      bottleneck = 'production';
    }
    
    // 构建子节点（依赖的原料）
    const children: ProductionNode[] = [];
    const recipe = facilityService.getRecipeForItem(itemId);
    
    if (recipe && depth < 5) { // 限制深度避免过深递归
      Object.entries(recipe.in).forEach(([inputId, amount]) => {
        const inputRate = (amount / (recipe.time || 1)) * requiredRate;
        const childNode = buildProductionNode(inputId, inputRate, depth + 1, new Set(visited));
        children.push(childNode);
      });
    }
    
    visited.delete(itemId);
    
    return {
      itemId,
      itemName,
      requiredRate,
      actualRate,
      efficiency,
      bottleneck,
      children,
      depth,
    };
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (node: ProductionNode) => {
    if (node.bottleneck === 'none' && node.actualRate >= node.requiredRate * 0.95) {
      return <CheckCircleIcon />;
    } else if (node.actualRate >= node.requiredRate * 0.7) {
      return <WarningIcon />;
    } else {
      return <ErrorIcon />;
    }
  };

  const getStatusText = (node: ProductionNode) => {
    if (node.bottleneck === 'production') {
      return '产能不足';
    } else if (node.bottleneck === 'logistics') {
      return '物流瓶颈';
    } else if (node.bottleneck === 'resources') {
      return '原料不足';
    } else if (node.actualRate >= node.requiredRate * 0.95) {
      return '正常';
    } else {
      return '效率低下';
    }
  };

  const renderNode = (node: ProductionNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.itemId);
    const status = node.actualRate >= node.requiredRate * 0.95 ? 'good' : 
                   node.actualRate >= node.requiredRate * 0.7 ? 'warning' : 'error';

    return (
      <Box key={node.itemId} sx={{ ml: node.depth > 0 ? 3 : 0 }}>
        <ChainItem>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">
                  {node.itemName}
                </Typography>
                <StatusChip
                  size="small"
                  label={getStatusText(node)}
                  icon={getStatusIcon(node)}
                  status={status}
                />
              </Box>
              
              <Box display="flex" gap={2} mt={1}>
                <Typography variant="caption" color="text.secondary">
                  需求: {node.requiredRate.toFixed(2)}/秒
                </Typography>
                <Typography 
                  variant="caption" 
                  color={status === 'good' ? 'success.main' : status === 'warning' ? 'warning.main' : 'error.main'}
                >
                  实际: {node.actualRate.toFixed(2)}/秒
                </Typography>
              </Box>
              
              <Box mt={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption">效率</Typography>
                  <Typography variant="caption">{(node.efficiency * 100).toFixed(0)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={node.efficiency * 100}
                  sx={{
                    height: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: status === 'good' ? '#4caf50' : 
                                     status === 'warning' ? '#ff9800' : '#f44336',
                    },
                  }}
                />
              </Box>
            </Box>
            
            {hasChildren && (
              <IconButton size="small" onClick={() => toggleNode(node.itemId)}>
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </ChainItem>
        
        {hasChildren && (
          <Collapse in={isExpanded}>
            <Box mt={1}>
              {node.children.map(child => renderNode(child))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box p={2}>
        <Typography>分析生产链...</Typography>
      </Box>
    );
  }

  if (!rootNode) {
    return (
      <Box p={2}>
        <Alert severity="error">无法分析生产链</Alert>
      </Box>
    );
  }

  // 计算总体统计
  const countNodes = (node: ProductionNode): { total: number; good: number; warning: number; error: number } => {
    const result = {
      total: 1,
      good: node.actualRate >= node.requiredRate * 0.95 ? 1 : 0,
      warning: node.actualRate >= node.requiredRate * 0.7 && node.actualRate < node.requiredRate * 0.95 ? 1 : 0,
      error: node.actualRate < node.requiredRate * 0.7 ? 1 : 0,
    };
    
    node.children.forEach(child => {
      const childResult = countNodes(child);
      result.total += childResult.total;
      result.good += childResult.good;
      result.warning += childResult.warning;
      result.error += childResult.error;
    });
    
    return result;
  };

  const stats = countNodes(rootNode);

  return (
    <Box>
      <ChainCard elevation={0}>
        <Typography variant="h6" gutterBottom>
          生产链分析
        </Typography>
        
        <Box display="flex" gap={3} mb={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              总节点数
            </Typography>
            <Typography variant="h6">
              {stats.total}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="success.main">
              正常运行
            </Typography>
            <Typography variant="h6" color="success.main">
              {stats.good}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="warning.main">
              效率低下
            </Typography>
            <Typography variant="h6" color="warning.main">
              {stats.warning}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="error.main">
              严重问题
            </Typography>
            <Typography variant="h6" color="error.main">
              {stats.error}
            </Typography>
          </Box>
        </Box>
        
        <Alert 
          severity={stats.error > 0 ? 'error' : stats.warning > 0 ? 'warning' : 'success'}
          variant="outlined"
        >
          {stats.error > 0 
            ? `生产链中有${stats.error}个严重瓶颈需要解决`
            : stats.warning > 0
            ? `生产链中有${stats.warning}个环节效率低下`
            : '生产链运行正常'}
        </Alert>
      </ChainCard>
      
      <Box>
        {renderNode(rootNode)}
      </Box>
    </Box>
  );
};

export default ProductionChainAnalyzer;