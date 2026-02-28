import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Grid,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  PowerSettingsNew,
  LocalFireDepartment,
  Warning,
  CheckCircle,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import { FacilityStatus } from '@/types/facilities';
import type { FacilityInstance } from '@/types/facilities';
import useGameStore from '@/store/gameStore';
import FactorioIcon from '@/components/common/FactorioIcon';
import { useDataService } from '@/hooks/useDIServices';
import { FuelStatusDisplay } from '@/components/facilities/FuelStatusDisplay';
import { useGameRuntimeRegistry } from '@/app/runtime/useGameRuntimeRegistry';

interface DisplayFacility {
  id: string;
  facilityId: string;
  count: number;
  status: FacilityStatus;
  efficiency: number;
  productionRecipeId: string | null;
  productionProgress: number;
  fuelLabel: string | null;
  legacyFuelBuffer?: FacilityInstance['fuelBuffer'];
}

const ProductionMonitor: React.FC = () => {
  const { facilities, updateFacility } = useGameStore();
  const dataService = useDataService();
  const runtimeRegistry = useGameRuntimeRegistry();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const runtimeMode = runtimeRegistry.status === 'ready' && !!runtimeRegistry.runtimeState;

  const displayFacilities = useMemo<DisplayFacility[]>(() => {
    if (runtimeMode && runtimeRegistry.runtimeState) {
      return runtimeRegistry.runtimeState.facilities.map(facility => ({
        id: facility.id,
        facilityId: facility.facilityId,
        count: facility.count,
        status: facility.status,
        efficiency: facility.efficiency,
        productionRecipeId: facility.production?.recipeId || null,
        productionProgress: facility.production?.progress || 0,
        fuelLabel: facility.fuel
          ? `${facility.fuel.itemId || 'unknown'} x${facility.fuel.quantity}`
          : null,
      }));
    }

    return facilities.map(facility => ({
      id: facility.id,
      facilityId: facility.facilityId,
      count: facility.count,
      status: facility.status,
      efficiency: facility.efficiency,
      productionRecipeId: facility.production?.currentRecipeId || null,
      productionProgress: facility.production?.progress || 0,
      fuelLabel: null,
      legacyFuelBuffer: facility.fuelBuffer,
    }));
  }, [runtimeMode, runtimeRegistry.runtimeState, facilities]);

  const groupedFacilities = useMemo(() => {
    const filtered = displayFacilities.filter(facility => {
      const name = dataService.getItemName(facility.facilityId) || facility.facilityId;
      if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

    const groups = new Map<string, DisplayFacility[]>();
    filtered.forEach(facility => {
      const category = getFacilityCategory(facility.facilityId);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(facility);
    });

    return groups;
  }, [displayFacilities, searchTerm, dataService]);

  const getFacilityCategory = (facilityId: string): string => {
    if (facilityId.includes('mining-drill')) return 'mining';
    if (facilityId.includes('furnace')) return 'smelting';
    if (facilityId.includes('assembling-machine')) return 'crafting';
    if (facilityId.includes('chemical') || facilityId.includes('refinery')) return 'chemical';
    if (facilityId.includes('lab')) return 'research';
    if (
      facilityId.includes('engine') ||
      facilityId.includes('turbine') ||
      facilityId.includes('solar')
    )
      return 'power';
    return 'other';
  };

  const getStatusChip = (status: FacilityStatus) => {
    const config = {
      [FacilityStatus.RUNNING]: {
        label: '运行中',
        color: 'success' as const,
        icon: <CheckCircle fontSize="small" />,
      },
      [FacilityStatus.STOPPED]: {
        label: '已停止',
        color: 'default' as const,
        icon: <PowerSettingsNew fontSize="small" />,
      },
      [FacilityStatus.NO_POWER]: {
        label: '缺电',
        color: 'error' as const,
        icon: <Warning fontSize="small" />,
      },
      [FacilityStatus.NO_FUEL]: {
        label: '缺燃料',
        color: 'warning' as const,
        icon: <LocalFireDepartment fontSize="small" />,
      },
      [FacilityStatus.NO_RESOURCE]: {
        label: '缺原料',
        color: 'warning' as const,
        icon: <Warning fontSize="small" />,
      },
      [FacilityStatus.OUTPUT_FULL]: {
        label: '输出满',
        color: 'warning' as const,
        icon: <Warning fontSize="small" />,
      },
    };

    const { label, color, icon } = config[status] || config[FacilityStatus.STOPPED];
    return <Chip label={label} color={color} size="small" icon={icon} />;
  };

  const toggleFacilityStatus = (facilityId: string, currentStatus: FacilityStatus) => {
    if (runtimeMode) {
      return;
    }

    const newStatus =
      currentStatus === FacilityStatus.RUNNING ? FacilityStatus.STOPPED : FacilityStatus.RUNNING;
    updateFacility(facilityId, { status: newStatus });
  };

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>设施</TableCell>
            <TableCell align="center">数量</TableCell>
            <TableCell align="center">状态</TableCell>
            <TableCell align="center">效率</TableCell>
            <TableCell>当前生产</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(groupedFacilities.entries()).map(([category, facilityList]) => (
            <React.Fragment key={category}>
              <TableRow>
                <TableCell colSpan={6} sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>
                  {getCategoryName(category)} ({facilityList.length})
                </TableCell>
              </TableRow>
              {facilityList.map(facility => {
                const name = dataService.getItemName(facility.facilityId) || facility.facilityId;
                return (
                  <TableRow key={facility.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <FactorioIcon itemId={facility.facilityId} size={24} />
                        <Typography variant="body2">{name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">{facility.count}</TableCell>
                    <TableCell align="center">{getStatusChip(facility.status)}</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(facility.efficiency * 100).toFixed(0)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {facility.productionRecipeId ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <FactorioIcon
                            itemId={facility.productionRecipeId.replace('-recipe', '')}
                            size={20}
                          />
                          <Typography variant="caption">
                            {(facility.productionProgress * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          无配方
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={facility.status === FacilityStatus.RUNNING ? '停止' : '启动'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => toggleFacilityStatus(facility.id, facility.status)}
                            color={facility.status === FacilityStatus.RUNNING ? 'error' : 'success'}
                            disabled={runtimeMode}
                          >
                            <PowerSettingsNew />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderGridView = () => (
    <Box>
      {Array.from(groupedFacilities.entries()).map(([category, facilityList]) => (
        <Box key={category} mb={3}>
          <Typography variant="h6" gutterBottom>
            {getCategoryName(category)} ({facilityList.length})
          </Typography>
          <Grid container spacing={2}>
            {facilityList.map(facility => {
              const name = dataService.getItemName(facility.facilityId) || facility.facilityId;
              return (
                <Box
                  key={facility.id}
                  sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 1' } }}
                >
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <FactorioIcon itemId={facility.facilityId} size={32} />
                          <Box>
                            <Typography variant="body1">{name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              数量: {facility.count}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleFacilityStatus(facility.id, facility.status)}
                          color={facility.status === FacilityStatus.RUNNING ? 'error' : 'success'}
                          disabled={runtimeMode}
                        >
                          <PowerSettingsNew />
                        </IconButton>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getStatusChip(facility.status)}
                        <Chip
                          label={`效率: ${(facility.efficiency * 100).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {facility.legacyFuelBuffer && (
                        <FuelStatusDisplay fuelBuffer={facility.legacyFuelBuffer} compact />
                      )}

                      {runtimeMode && facility.fuelLabel && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`燃料: ${facility.fuelLabel}`}
                          sx={{ mb: 1 }}
                        />
                      )}

                      {facility.productionRecipeId && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            生产中:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <FactorioIcon
                              itemId={facility.productionRecipeId.replace('-recipe', '')}
                              size={20}
                            />
                            <LinearProgress
                              variant="determinate"
                              value={facility.productionProgress * 100}
                              sx={{ flex: 1, height: 6 }}
                            />
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );

  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      mining: '采矿设施',
      smelting: '熔炼设施',
      crafting: '制造设施',
      chemical: '化工设施',
      research: '研究设施',
      power: '发电设施',
      other: '其他设施',
    };
    return names[category] || category;
  };

  return (
    <Box>
      {runtimeMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          当前页面使用 Experimental Runtime 设施快照（只读）。
        </Alert>
      )}

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          size="small"
          placeholder="搜索设施..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, maxWidth: 300 }}
        />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="list">
            <ViewList />
          </ToggleButton>
          <ToggleButton value="grid">
            <ViewModule />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <Chip label={`总设施: ${displayFacilities.length}`} />
        <Chip
          label={`运行中: ${displayFacilities.filter(f => f.status === FacilityStatus.RUNNING).length}`}
          color="success"
        />
        <Chip
          label={`停止: ${displayFacilities.filter(f => f.status === FacilityStatus.STOPPED).length}`}
        />
        <Chip
          label={`异常: ${
            displayFacilities.filter(
              f => f.status !== FacilityStatus.RUNNING && f.status !== FacilityStatus.STOPPED
            ).length
          }`}
          color="warning"
        />
      </Box>

      {viewMode === 'list' ? renderListView() : renderGridView()}
    </Box>
  );
};

export default ProductionMonitor;
