import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  TipsAndUpdates,
  Warning,
  CheckCircle,
  ExpandMore,
  AutoFixHigh,
  Speed,
  Battery20,
  LocalFireDepartment,
} from '@mui/icons-material';
import useGameStore from '@/store/gameStore';
import { usePowerService, useDataService } from '@/hooks/useDIServices';
import { useRecipeService } from '@/hooks/useDIServices';
import { FacilityStatus } from '@/types/facilities';
import FactorioIcon from '@/components/common/FactorioIcon';
import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import {
  buildRuntimePowerBalanceView,
  type RuntimePowerBalanceView,
} from '@/engine/selectors/facilitySelectors';

interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'warning' | 'improvement';
  category: 'power' | 'production' | 'fuel' | 'bottleneck';
  title: string;
  description: string;
  impact: string;
  action?: () => void;
  actionLabel?: string;
}

interface FacilityView {
  status: FacilityStatus;
  efficiency: number;
  recipeId: string | null;
}

const EfficiencyOptimizer: React.FC = () => {
  const { facilities } = useGameStore();
  const powerService = usePowerService();
  const dataService = useDataService();
  const recipeService = useRecipeService();
  const runtimeRegistry = useGameRuntimeRegistry();

  const runtimeMode = runtimeRegistry.status === 'ready' && !!runtimeRegistry.runtimeState;

  const facilityViews = useMemo<FacilityView[]>(() => {
    if (runtimeMode && runtimeRegistry.runtimeState) {
      return runtimeRegistry.runtimeState.facilities.map(facility => ({
        status: facility.status,
        efficiency: facility.efficiency,
        recipeId: facility.production?.recipeId || null,
      }));
    }

    return facilities.map(facility => ({
      status: facility.status,
      efficiency: facility.efficiency,
      recipeId: facility.production?.currentRecipeId || null,
    }));
  }, [runtimeMode, runtimeRegistry.runtimeState, facilities]);

  const legacyPowerBalance = useMemo(() => {
    return powerService.calculatePowerBalance(facilities);
  }, [powerService, facilities]);

  const powerBalance = useMemo<RuntimePowerBalanceView>(() => {
    if (!runtimeMode || !runtimeRegistry.runtimeState || !runtimeRegistry.runtime) {
      return legacyPowerBalance;
    }

    return buildRuntimePowerBalanceView(
      runtimeRegistry.runtimeState,
      runtimeRegistry.runtime.getCatalog()
    );
  }, [runtimeMode, runtimeRegistry.runtimeState, runtimeRegistry.runtime, legacyPowerBalance]);

  const identifyBottlenecks = useCallback((): Map<string, number> => {
    const itemDeficits = new Map<string, number>();

    facilityViews.forEach(facility => {
      if (facility.status !== FacilityStatus.NO_RESOURCE || !facility.recipeId) {
        return;
      }

      const recipe =
        runtimeMode && runtimeRegistry.runtime
          ? runtimeRegistry.runtime.getCatalog().recipesById.get(facility.recipeId)
          : recipeService.getRecipeById(facility.recipeId);

      if (!recipe?.in) {
        return;
      }

      Object.entries(recipe.in).forEach(([itemId, amount]) => {
        const current = itemDeficits.get(itemId) || 0;
        itemDeficits.set(itemId, current + (amount as number));
      });
    });

    return itemDeficits;
  }, [facilityViews, runtimeMode, runtimeRegistry.runtime, recipeService]);

  const efficiencyMetrics = useMemo(() => {
    const totalFacilities = facilityViews.length;
    const runningFacilities = facilityViews.filter(f => f.status === FacilityStatus.RUNNING).length;
    const utilizationRate = totalFacilities > 0 ? runningFacilities / totalFacilities : 0;

    const avgEfficiency =
      facilityViews.length > 0
        ? facilityViews.reduce((sum, f) => sum + f.efficiency, 0) / facilityViews.length
        : 0;

    const bottlenecks = identifyBottlenecks();

    return {
      powerBalance,
      utilizationRate,
      avgEfficiency,
      bottlenecks,
    };
  }, [facilityViews, identifyBottlenecks, powerBalance]);

  const suggestions = useMemo((): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    if (efficiencyMetrics.powerBalance.status === 'deficit') {
      suggestions.push({
        id: 'power-deficit',
        type: 'critical',
        category: 'power',
        title: '电力严重不足',
        description: `当前电力满足率仅 ${(efficiencyMetrics.powerBalance.satisfactionRatio * 100).toFixed(0)}%，所有设施效率降低`,
        impact: `生产效率降至 ${(efficiencyMetrics.powerBalance.satisfactionRatio * 100).toFixed(0)}%`,
        actionLabel: '增加发电设施',
      });
    }

    if (efficiencyMetrics.utilizationRate < 0.5) {
      suggestions.push({
        id: 'low-utilization',
        type: 'warning',
        category: 'production',
        title: '设施利用率低',
        description: `仅有 ${(efficiencyMetrics.utilizationRate * 100).toFixed(0)}% 的设施在运行`,
        impact: '大量设施闲置，浪费投资',
      });
    }

    const fuelShortage = facilityViews.filter(f => f.status === FacilityStatus.NO_FUEL);
    if (fuelShortage.length > 0) {
      suggestions.push({
        id: 'fuel-shortage',
        type: 'critical',
        category: 'fuel',
        title: `${fuelShortage.length} 个设施缺少燃料`,
        description: '部分设施因缺少燃料而停止运行',
        impact: '生产完全停止',
        actionLabel: '检查燃料供应',
      });
    }

    efficiencyMetrics.bottlenecks.forEach((_deficit, itemId) => {
      const itemName = dataService.getItemName(itemId) || itemId;
      suggestions.push({
        id: `bottleneck-${itemId}`,
        type: 'warning',
        category: 'bottleneck',
        title: `${itemName} 供应不足`,
        description: `多个设施因缺少 ${itemName} 而无法正常生产`,
        impact: '相关生产链停滞',
        actionLabel: '增加产能',
      });
    });

    if (
      efficiencyMetrics.avgEfficiency < 0.8 &&
      efficiencyMetrics.powerBalance.status !== 'deficit'
    ) {
      suggestions.push({
        id: 'low-efficiency',
        type: 'improvement',
        category: 'production',
        title: '整体效率偏低',
        description: `平均设施效率仅 ${(efficiencyMetrics.avgEfficiency * 100).toFixed(0)}%`,
        impact: '生产速度低于预期',
        actionLabel: '优化配置',
      });
    }

    return suggestions.sort((a, b) => {
      const priority = { critical: 0, warning: 1, improvement: 2 };
      return priority[a.type] - priority[b.type];
    });
  }, [efficiencyMetrics, dataService, facilityViews]);

  const getSuggestionIcon = (suggestion: OptimizationSuggestion) => {
    const icons = {
      power: <Battery20 />,
      production: <Speed />,
      fuel: <LocalFireDepartment />,
      bottleneck: <Warning />,
    };
    return icons[suggestion.category] || <TipsAndUpdates />;
  };

  const getSuggestionColor = (type: string) => {
    return type === 'critical' ? 'error' : type === 'warning' ? 'warning' : 'info';
  };

  return (
    <Box>
      {runtimeMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          当前页面使用 Experimental Runtime 设施快照（只读）。
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            效率概览
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                设施利用率
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5">
                  {(efficiencyMetrics.utilizationRate * 100).toFixed(0)}%
                </Typography>
                <Chip
                  size="small"
                  label={efficiencyMetrics.utilizationRate > 0.8 ? '良好' : '偏低'}
                  color={efficiencyMetrics.utilizationRate > 0.8 ? 'success' : 'warning'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={efficiencyMetrics.utilizationRate * 100}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                平均效率
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5">
                  {(efficiencyMetrics.avgEfficiency * 100).toFixed(0)}%
                </Typography>
                <Chip
                  size="small"
                  label={efficiencyMetrics.avgEfficiency > 0.9 ? '优秀' : '需改进'}
                  color={efficiencyMetrics.avgEfficiency > 0.9 ? 'success' : 'warning'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={efficiencyMetrics.avgEfficiency * 100}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                电力满足率
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h5">
                  {(efficiencyMetrics.powerBalance.satisfactionRatio * 100).toFixed(0)}%
                </Typography>
                <Chip
                  size="small"
                  label={efficiencyMetrics.powerBalance.status}
                  color={
                    efficiencyMetrics.powerBalance.status === 'surplus'
                      ? 'success'
                      : efficiencyMetrics.powerBalance.status === 'balanced'
                        ? 'info'
                        : 'error'
                  }
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={efficiencyMetrics.powerBalance.satisfactionRatio * 100}
                sx={{ mt: 1 }}
                color={efficiencyMetrics.powerBalance.satisfactionRatio >= 1 ? 'success' : 'error'}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        优化建议 ({suggestions.length})
      </Typography>

      {suggestions.length === 0 ? (
        <Alert severity="success" icon={<CheckCircle />}>
          太棒了！当前没有需要优化的问题。
        </Alert>
      ) : (
        <Box>
          {suggestions.map(suggestion => (
            <Accordion key={suggestion.id} defaultExpanded={suggestion.type === 'critical'}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  <ListItemIcon
                    sx={{ minWidth: 'auto', color: `${getSuggestionColor(suggestion.type)}.main` }}
                  >
                    {getSuggestionIcon(suggestion)}
                  </ListItemIcon>
                  <Typography flex={1}>{suggestion.title}</Typography>
                  <Chip
                    label={
                      suggestion.type === 'critical'
                        ? '严重'
                        : suggestion.type === 'warning'
                          ? '警告'
                          : '建议'
                    }
                    size="small"
                    color={getSuggestionColor(suggestion.type)}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" paragraph>
                    {suggestion.description}
                  </Typography>
                  <Alert
                    severity={suggestion.type === 'improvement' ? 'info' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">影响：{suggestion.impact}</Typography>
                  </Alert>
                  {suggestion.actionLabel && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AutoFixHigh />}
                      onClick={suggestion.action}
                    >
                      {suggestion.actionLabel}
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {efficiencyMetrics.bottlenecks.size > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              生产瓶颈物品
            </Typography>
            <List>
              {Array.from(efficiencyMetrics.bottlenecks.entries()).map(([itemId, deficit]) => (
                <ListItem key={itemId}>
                  <ListItemIcon>
                    <FactorioIcon itemId={itemId} size={32} />
                  </ListItemIcon>
                  <ListItemText
                    primary={dataService.getItemName(itemId) || itemId}
                    secondary={`需求缺口：${deficit.toFixed(0)} 个/分钟`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EfficiencyOptimizer;
