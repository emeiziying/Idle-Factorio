import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, LocalFireDepartment, Info } from '@mui/icons-material';
import FactorioIcon from '../common/FactorioIcon';
import { FUEL_PRIORITY } from '../../data/fuelConfigs';
import { DataService } from '../../services/DataService';

interface FuelPrioritySettingsProps {
  onPriorityChange?: (newPriority: string[]) => void;
}

const FuelPrioritySettings: React.FC<FuelPrioritySettingsProps> = ({ onPriorityChange }) => {
  const [fuelPriority, setFuelPriority] = useState<string[]>(FUEL_PRIORITY);
  const dataService = DataService.getInstance();

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPriority = [...fuelPriority];
    [newPriority[index - 1], newPriority[index]] = [newPriority[index], newPriority[index - 1]];
    setFuelPriority(newPriority);
    onPriorityChange?.(newPriority);
  };

  const handleMoveDown = (index: number) => {
    if (index === fuelPriority.length - 1) return;
    const newPriority = [...fuelPriority];
    [newPriority[index], newPriority[index + 1]] = [newPriority[index + 1], newPriority[index]];
    setFuelPriority(newPriority);
    onPriorityChange?.(newPriority);
  };

  const getFuelInfo = (fuelId: string) => {
    const item = dataService.getItem(fuelId);
    if (!item?.fuel) return { name: fuelId, energy: 0 };

    const energy = item.fuel.value;
    let energyText = '';
    if (energy >= 1000) {
      energyText = `${(energy / 1000).toFixed(1)} GJ`;
    } else {
      energyText = `${energy} MJ`;
    }

    return {
      name: dataService.getItemName(fuelId),
      energy: energyText,
    };
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocalFireDepartment />
          <Typography variant="h6">燃料使用优先级</Typography>
          <Tooltip title="设施会按照此顺序自动选择燃料。将常用燃料放在前面，将需要保留的材料放在后面。">
            <Info fontSize="small" color="action" />
          </Tooltip>
        </Box>

        <List dense>
          {fuelPriority.map((fuelId, index) => {
            const fuelInfo = getFuelInfo(fuelId);
            return (
              <ListItem
                key={fuelId}
                sx={{
                  bgcolor: index === 0 ? 'action.hover' : 'transparent',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon>
                  <FactorioIcon itemId={fuelId} size={32} />
                </ListItemIcon>
                <ListItemText
                  primary={fuelInfo.name}
                  secondary={
                    <Typography variant="caption" component="span">
                      能量值: {fuelInfo.energy}
                    </Typography>
                  }
                />
                <Box display="flex" alignItems="center" gap={1} sx={{ mr: 1 }}>
                  {index === 0 && (
                    <Chip label="优先使用" size="small" color="primary" variant="outlined" />
                  )}
                  {fuelId === 'wood' && (
                    <Chip label="建议保留" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === fuelPriority.length - 1}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            );
          })}
        </List>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          提示：木材通常用于制作电线杆等物品，建议将其优先级设置较低。
        </Typography>
      </CardContent>
    </Card>
  );
};

export default FuelPrioritySettings;
