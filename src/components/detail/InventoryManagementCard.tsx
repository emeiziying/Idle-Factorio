import React from "react";
import {
  Typography,
  Chip,
  Box,
  Button,
  useTheme,
} from "@mui/material";
import type { Item } from "../../types/index";
import useGameStore from "../../store/gameStore";
import { storageService } from "../../services/StorageService";
import FactorioIcon from "../common/FactorioIcon";
import { DataService } from "../../services/DataService";

interface InventoryManagementCardProps {
  item: Item;
}

const InventoryManagementCard: React.FC<InventoryManagementCardProps> = ({
  item,
}) => {
  const theme = useTheme();
  const dataService = DataService.getInstance();
  const {
    getInventoryItem,
    getDeployedContainersForItem,
    removeDeployedContainer,
    updateInventory,
  } = useGameStore();

  const inventoryItem = getInventoryItem(item.id);
  const deployedContainers = getDeployedContainersForItem(item.id);

  // 判断是否为液体物品
  const isLiquidItem = item.category === "fluids";

  // 获取可用的存储类型
  const availableStorageTypes = isLiquidItem
    ? storageService.getLiquidStorageTypes()
    : storageService.getSolidStorageTypes();

  const handleAddStorage = (storageType: string) => {
    const storageConfig = storageService.getStorageConfig(storageType);
    if (!storageConfig) return;

    // 检查是否有该存储设备
    const storageInventory = getInventoryItem(storageConfig.itemId);
    if (storageInventory.currentAmount > 0) {
      // 直接部署存储设备
      const result = useGameStore
        .getState()
        .deployChestForStorage(storageType, item.id);
      if (result.success) {
        // 消耗一个存储设备
        updateInventory(storageConfig.itemId, -1);
      }
    }
  };

  const handleRemoveStorage = (containerId: string) => {
    const container = deployedContainers.find((c) => c.id === containerId);
    if (container) {
      // 移除存储设备并归还一个存储设备到库存
      removeDeployedContainer(containerId);
      updateInventory(container.chestItemId, 1);
    }
  };

  const getLocalizedItemName = (itemId: string): string => {
    return dataService.getLocalizedItemName(itemId);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ 
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'text.primary',
        mb: 1
      }}>
        库存管理
      </Typography>

      {/* 存储设备列表 - 纵向排列 */}
      <Box display="flex" flexDirection="column" gap={1}>
        {availableStorageTypes.map((storageType) => {
          const storageConfig = storageService.getStorageConfig(storageType);
          if (!storageConfig) return null;

          const storageInventory = getInventoryItem(storageConfig.itemId);
          const deployedCount = deployedContainers.filter(
            (c) => c.chestType === storageType
          ).length;

          return (
            <Box
              key={storageType}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              {/* 左侧：图标和描述 */}
              <Box display="flex" alignItems="center" gap={1}>
                <FactorioIcon
                  itemId={storageConfig.itemId}
                  size={32}
                  quantity={deployedCount}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getLocalizedItemName(storageConfig.itemId)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {storageConfig.category === "liquid"
                      ? `液体容量: ${
                          storageConfig.fluidCapacity?.toLocaleString() || 0
                        }`
                      : `额外堆叠: +${storageConfig.additionalStacks || 0}`}
                    {deployedCount > 0 && ` (已部署: ${deployedCount})`}
                  </Typography>
                </Box>
              </Box>

              {/* 右侧：加减按钮 */}
              <Box display="flex" gap={0.5}>
                <Button
                  onClick={() => handleAddStorage(storageType)}
                  disabled={storageInventory.currentAmount <= 0}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  添加
                </Button>
                <Button
                  onClick={() => {
                    const container = deployedContainers.find(
                      (c) => c.chestType === storageType
                    );
                    if (container) handleRemoveStorage(container.id);
                  }}
                  disabled={deployedCount <= 0}
                  variant="contained"
                  color="error"
                  size="small"
                >
                  移除
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 状态提示 */}
      {inventoryItem.status !== "normal" && (
        <Box mt={1}>
          <Chip
            label={inventoryItem.status}
            color="warning"
            size="small"
            sx={theme.customStyles.typography.tiny}
          />
        </Box>
      )}
    </Box>
  );
};

export default InventoryManagementCard;
