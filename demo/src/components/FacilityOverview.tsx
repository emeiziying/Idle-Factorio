import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  styled,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import FactoryIcon from '@mui/icons-material/Factory';
import BoltIcon from '@mui/icons-material/Bolt';
import { facilityService } from '../services/FacilityService';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';
import { powerService } from '../services/PowerService';
import { Facility } from '../types/facilities';
import FacilityLogisticsPanel from './FacilityLogisticsPanel';
import PowerManagementPanel from './PowerManagementPanel';

const OverviewCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#f8f9fa',
}));

const FacilityItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: '#fff',
  '&:hover': {
    backgroundColor: '#f0f0f0',
  },
}));

const EfficiencyBar = styled(LinearProgress)<{ efficiency: number }>(({ efficiency }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: '#e0e0e0',
  '& .MuiLinearProgress-bar': {
    backgroundColor: efficiency >= 0.9 ? '#4caf50' : efficiency >= 0.7 ? '#ff9800' : '#f44336',
  },
}));

interface FacilityGroup {
  itemId: string;
  itemName: string;
  facilities: Facility[];
  totalProduction: number;
  totalConsumption: number;
  avgEfficiency: number;
}

const FacilityOverview: React.FC = () => {
  const [facilityGroups, setFacilityGroups] = useState<FacilityGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [showPowerManagement, setShowPowerManagement] = useState(false);

  useEffect(() => {
    updateFacilityGroups();
    const interval = setInterval(() => {
      updateFacilityGroups();
      // 同时更新电力系统
      powerService.simulatePowerProduction();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateFacilityGroups = () => {
    const allFacilities = facilityService.getAllFacilities();
    const groups = new Map<string, FacilityGroup>();

    allFacilities.forEach(facility => {
      const { inputRate, outputRate } = facilityService.calculateFacilityProduction(facility);
      const logistics = simpleLogisticsService.getFacilityLogistics(facility.itemId);
      
      if (!groups.has(facility.itemId)) {
        groups.set(facility.itemId, {
          itemId: facility.itemId,
          itemName: facility.itemId, // 这里应该从物品数据获取名称
          facilities: [],
          totalProduction: 0,
          totalConsumption: 0,
          avgEfficiency: 0,
        });
      }

      const group = groups.get(facility.itemId)!;
      group.facilities.push(facility);
      group.totalProduction += outputRate;
      group.totalConsumption += Object.values(inputRate).reduce((a, b) => a + b, 0);
      
      if (logistics) {
        group.avgEfficiency += logistics.efficiency;
      }
    });

    // 计算平均效率
    groups.forEach(group => {
      if (group.facilities.length > 0) {
        group.avgEfficiency /= group.facilities.length;
      }
    });

    setFacilityGroups(Array.from(groups.values()));
  };

  const toggleGroup = (itemId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleConfigureFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setConfigDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mining': return '#795548';
      case 'smelting': return '#ff9800';
      case 'crafting': return '#2196f3';
      case 'chemical': return '#4caf50';
      case 'research': return '#9c27b0';
      default: return '#757575';
    }
  };

  if (showPowerManagement) {
    return <PowerManagementPanel onBack={() => setShowPowerManagement(false)} />;
  }

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          <FactoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          设施总览
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setShowPowerManagement(true)}
          startIcon={<BoltIcon />}
        >
          电力管理
        </Button>
      </Box>

      <OverviewCard elevation={0}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          总产能统计
        </Typography>
        <Box display="flex" gap={3}>
          <Box>
            <Typography variant="h6">
              {facilityGroups.reduce((sum, g) => sum + g.facilities.length, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              总设施数
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="success.main">
              {facilityGroups.filter(g => g.avgEfficiency >= 0.9).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              高效运行
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="warning.main">
              {facilityGroups.filter(g => g.avgEfficiency < 0.9 && g.avgEfficiency >= 0.7).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              效率低下
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="error.main">
              {facilityGroups.filter(g => g.avgEfficiency < 0.7).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              严重瓶颈
            </Typography>
          </Box>
        </Box>
      </OverviewCard>

      <List>
        {facilityGroups.map(group => (
          <React.Fragment key={group.itemId}>
            <FacilityItem onClick={() => toggleGroup(group.itemId)}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">
                      {group.itemName}
                    </Typography>
                    <Chip
                      label={`${group.facilities.length}个设施`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box mt={0.5}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption">
                        产能: {group.totalProduction.toFixed(1)}/秒
                      </Typography>
                      <Typography variant="caption">
                        平均效率: {(group.avgEfficiency * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <EfficiencyBar
                      variant="determinate"
                      value={group.avgEfficiency * 100}
                      efficiency={group.avgEfficiency}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end">
                  {expandedGroups.has(group.itemId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </ListItemSecondaryAction>
            </FacilityItem>

            <Collapse in={expandedGroups.has(group.itemId)}>
              <Box pl={2} pr={2} pb={2}>
                {group.facilities.map(facility => {
                  const facilityType = facilityService.getFacilityType(facility.type);
                  const { outputRate } = facilityService.calculateFacilityProduction(facility);
                  
                  return (
                    <Paper key={facility.id} sx={{ p: 2, mb: 1 }} elevation={0}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2">
                            {facilityType?.name || facility.type}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                            <Chip
                              label={facility.category}
                              size="small"
                              sx={{
                                backgroundColor: getCategoryColor(facility.category),
                                color: 'white',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {facility.count}台 • {outputRate.toFixed(1)}/秒
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleConfigureFacility(facility)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Collapse>
          </React.Fragment>
        ))}
      </List>

      {/* 设施配置对话框 */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          配置设施物流
        </DialogTitle>
        <DialogContent>
          {selectedFacility && (
            <FacilityLogisticsPanel
              itemId={selectedFacility.itemId}
              facilityType={facilityService.getFacilityType(selectedFacility.type)?.name || selectedFacility.type}
              facilityCount={selectedFacility.count}
              baseProductionRate={selectedFacility.baseOutputRate}
              baseConsumptionRate={Object.values(selectedFacility.baseInputRate).reduce((a, b) => a + b, 0)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilityOverview;