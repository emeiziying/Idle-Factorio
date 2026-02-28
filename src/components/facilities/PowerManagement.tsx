import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import { Bolt, Add, Remove } from '@mui/icons-material';
import { usePowerService } from '@/hooks/useDIServices';
import {
  buildRuntimeGeneratorStats,
  buildRuntimePowerBalanceView,
  type RuntimePowerBalanceView,
} from '@/engine/selectors/facilitySelectors';
import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';
import useGameStore from '@/store/gameStore';
import FactorioIcon from '@/components/common/FactorioIcon';

const PowerManagement: React.FC = () => {
  const { facilities, updateFacility, addFacility, removeFacility, getInventoryItem } =
    useGameStore();
  const runtimeRegistry = useGameRuntimeRegistry();
  const powerService = usePowerService();

  const runtimeMode = runtimeRegistry.status === 'ready' && !!runtimeRegistry.runtimeState;
  const runtimeState = runtimeRegistry.runtimeState;
  const runtimeCatalog = runtimeRegistry.runtime?.getCatalog();

  const legacyPowerBalance = useMemo(() => {
    return powerService.calculatePowerBalance(facilities);
  }, [powerService, facilities]);

  const powerBalance = useMemo<RuntimePowerBalanceView>(() => {
    if (!runtimeMode || !runtimeState || !runtimeCatalog) {
      return legacyPowerBalance;
    }

    return buildRuntimePowerBalanceView(runtimeState, runtimeCatalog);
  }, [runtimeMode, runtimeState, runtimeCatalog, legacyPowerBalance]);

  const generatorStats = useMemo(() => {
    if (runtimeMode && runtimeState) {
      return buildRuntimeGeneratorStats(runtimeState);
    }

    const stats = new Map<string, { count: number; power: number }>();

    facilities.forEach(facility => {
      const power = powerService.getFacilityPowerGeneration(facility) || 0;

      if (power > 0) {
        const existing = stats.get(facility.facilityId) || { count: 0, power: 0 };
        stats.set(facility.facilityId, {
          count: existing.count + facility.count,
          power: existing.power + power,
        });
      }
    });

    return stats;
  }, [runtimeMode, runtimeState, facilities, powerService]);

  const formatPower = (kw: number): string => {
    if (kw >= 1000) {
      return `${(kw / 1000).toFixed(1)} MW`;
    }
    return `${kw.toFixed(0)} kW`;
  };

  const getStatusColor = () => {
    switch (powerBalance.status) {
      case 'surplus':
        return 'success';
      case 'balanced':
        return 'info';
      case 'deficit':
        return 'error';
    }
  };

  const handleGeneratorChange = (facilityId: string, delta: number) => {
    if (runtimeMode) {
      return;
    }

    const existing = facilities.find(f => f.facilityId === facilityId);

    if (delta > 0) {
      const inventory = getInventoryItem(facilityId);
      if (inventory.currentAmount < delta) {
        return;
      }

      if (existing) {
        updateFacility(existing.id, { count: existing.count + delta });
      } else {
        addFacility({
          id: `${facilityId}-${Date.now()}`,
          facilityId,
          count: delta,
          status: 'running',
          efficiency: 1.0,
        });
      }
    } else if (delta < 0 && existing && existing.count >= Math.abs(delta)) {
      const newCount = existing.count + delta;
      if (newCount > 0) {
        updateFacility(existing.id, { count: newCount });
      } else {
        removeFacility(existing.id);
      }
    }
  };

  const getInventoryAmount = (facilityId: string): number => {
    if (runtimeMode && runtimeState) {
      return runtimeState.inventory.items[facilityId] || 0;
    }

    return getInventoryItem(facilityId).currentAmount;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        电力管理
      </Typography>

      {runtimeMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          当前页面使用 Experimental Runtime 电力快照（只读）。
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Bolt color={getStatusColor()} />
            <Typography variant="h6">电力平衡</Typography>
            <Chip
              label={
                powerBalance.status === 'surplus'
                  ? '盈余'
                  : powerBalance.status === 'balanced'
                    ? '平衡'
                    : '不足'
              }
              color={getStatusColor()}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                发电能力
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatPower(powerBalance.generationCapacity)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                实际发电: {formatPower(powerBalance.actualGeneration)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                电力需求
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatPower(powerBalance.consumptionDemand)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                实际消耗: {formatPower(powerBalance.actualConsumption)}
              </Typography>
            </Box>
          </Box>

          <Box mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">电力满足率</Typography>
              <Typography variant="body2">
                {(powerBalance.satisfactionRatio * 100).toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={powerBalance.satisfactionRatio * 100}
              color={
                powerBalance.satisfactionRatio >= 0.95
                  ? 'success'
                  : powerBalance.satisfactionRatio >= 0.7
                    ? 'warning'
                    : 'error'
              }
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>

          {powerBalance.status === 'deficit' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                电力不足！所有耗电设施的效率降至 {(powerBalance.satisfactionRatio * 100).toFixed(0)}
                %
              </Typography>
              {!runtimeMode &&
                powerService
                  .getPowerPriorityRecommendations(facilities, legacyPowerBalance)
                  .map((rec, i) => (
                    <Typography key={i} variant="caption" display="block">
                      • {rec}
                    </Typography>
                  ))}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            发电设施
          </Typography>

          <List>
            {['steam-engine', 'steam-turbine', 'solar-panel'].map(generatorId => {
              const stats = generatorStats.get(generatorId) || { count: 0, power: 0 };
              const inventoryAmount = getInventoryAmount(generatorId);
              const basePower =
                {
                  'steam-engine': 900,
                  'steam-turbine': 5800,
                  'solar-panel': 42,
                }[generatorId] || 0;

              return (
                <ListItem key={generatorId}>
                  <ListItemIcon>
                    <FactorioIcon itemId={generatorId} size={40} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>
                          {generatorId === 'steam-engine'
                            ? '蒸汽机'
                            : generatorId === 'steam-turbine'
                              ? '汽轮机'
                              : '太阳能板'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({formatPower(basePower)}/台)
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          部署: {stats.count} 台 | 发电: {formatPower(stats.power)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          display="block"
                        >
                          库存: {inventoryAmount} 台
                        </Typography>
                      </>
                    }
                  />
                  <Box display="flex" alignItems="center">
                    <IconButton
                      size="small"
                      onClick={() => handleGeneratorChange(generatorId, -1)}
                      disabled={runtimeMode || stats.count === 0}
                    >
                      <Remove />
                    </IconButton>
                    <Typography sx={{ mx: 1, minWidth: 30, textAlign: 'center' }}>
                      {stats.count}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleGeneratorChange(generatorId, 1)}
                      disabled={runtimeMode || inventoryAmount === 0}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            })}
          </List>

          {(generatorStats.get('steam-engine')?.count || 0) +
            (generatorStats.get('steam-turbine')?.count || 0) >
            0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                蒸汽机和汽轮机需要蒸汽供应才能发电。请在生产页面配置足够的锅炉。
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            电力消耗分析
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 2,
            }}
          >
            {Object.entries(powerBalance.consumptionByCategory).map(([category, power]) => (
              <Box key={category}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    {category === 'mining'
                      ? '采矿'
                      : category === 'smelting'
                        ? '熔炼'
                        : category === 'crafting'
                          ? '制造'
                          : category === 'chemical'
                            ? '化工'
                            : category === 'research'
                              ? '研究'
                              : '其他'}
                  </Typography>
                  <Typography variant="h6">{formatPower(power)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {powerBalance.consumptionDemand > 0
                      ? `${((power / powerBalance.consumptionDemand) * 100).toFixed(0)}%`
                      : '0%'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PowerManagement;
