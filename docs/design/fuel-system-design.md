# 燃料消耗系统设计文档

## 1. 系统概述

燃料消耗系统用于管理游戏中所有燃料型设施（如石炉、钢炉、热能采矿机等）的燃料供应和消耗。每个设施实例都有独立的燃料缓存区，可以存储一定量的燃料来维持运行。

## 2. 核心设计原则

1. **独立性**：每个设施实例拥有独立的燃料缓存区
2. **灵活性**：支持多种燃料类型，不同燃料有不同的能量值
3. **自动化**：自动从库存补充燃料，智能选择最优燃料
4. **可视化**：清晰显示燃料状态和消耗情况
5. **性能优化**：批量处理，避免频繁的小额更新

## 3. 数据结构设计

### 3.1 扩展 FacilityInstance 接口

```typescript
// src/types/facilities.ts
export interface FacilityInstance {
  id: string;
  facilityId: string;
  count: number;
  status: FacilityStatus;
  efficiency: number;
  powerConsumption?: number;
  powerGeneration?: number;
  production?: ProductionData;
  
  // 新增：燃料缓存区
  fuelBuffer?: FuelBuffer;
}

export interface FuelBuffer {
  // 当前燃料槽
  slots: FuelSlot[];
  // 最大槽位数（石炉1个，钢炉1个）
  maxSlots: number;
  // 当前总能量 (MJ)
  totalEnergy: number;
  // 最大能量存储 (MJ)
  maxEnergy: number;
  // 能量消耗率 (MW)
  consumptionRate: number;
  // 上次更新时间
  lastUpdate: number;
}

export interface FuelSlot {
  // 燃料物品ID
  itemId: string;
  // 数量
  quantity: number;
  // 剩余能量 (MJ)
  remainingEnergy: number;
}
```

### 3.2 燃料配置数据

```typescript
// src/data/fuelConfigs.ts
export interface FuelConfig {
  // 可接受的燃料类别
  acceptedCategories: FuelCategory[];
  // 燃料槽位数
  fuelSlots: number;
  // 单个槽位最大堆叠
  maxStackPerSlot: number;
  // 基础能耗 (MW)
  basePowerConsumption: number;
}

export const FACILITY_FUEL_CONFIGS: Record<string, FuelConfig> = {
  'stone-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.18  // 180kW
  },
  'steel-furnace': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.36  // 360kW
  },
  'burner-mining-drill': {
    acceptedCategories: ['chemical'],
    fuelSlots: 1,
    maxStackPerSlot: 50,
    basePowerConsumption: 0.15  // 150kW
  }
};

// 燃料优先级（从低到高）
export const FUEL_PRIORITY = [
  'wood',           // 2 MJ
  'coal',           // 4 MJ
  'solid-fuel',     // 12 MJ
  'rocket-fuel',    // 100 MJ
  'nuclear-fuel'    // 1.21 GJ
];
```

## 4. 服务层设计

### 4.1 FuelService 核心服务

```typescript
// src/services/FuelService.ts
export class FuelService {
  private static instance: FuelService;
  private dataService: DataService;
  
  private constructor() {
    this.dataService = DataService.getInstance();
  }
  
  static getInstance(): FuelService {
    if (!FuelService.instance) {
      FuelService.instance = new FuelService();
    }
    return FuelService.instance;
  }
  
  /**
   * 初始化设施的燃料缓存区
   */
  initializeFuelBuffer(facilityId: string): FuelBuffer {
    const config = FACILITY_FUEL_CONFIGS[facilityId];
    if (!config) {
      throw new Error(`No fuel config found for facility: ${facilityId}`);
    }
    
    return {
      slots: [],
      maxSlots: config.fuelSlots,
      totalEnergy: 0,
      maxEnergy: this.calculateMaxEnergy(config),
      consumptionRate: config.basePowerConsumption,
      lastUpdate: Date.now()
    };
  }
  
  /**
   * 更新燃料消耗
   */
  updateFuelConsumption(
    facility: FacilityInstance, 
    deltaTime: number,
    isProducing: boolean = true
  ): FuelUpdateResult {
    if (!facility.fuelBuffer) {
      return { success: false, reason: 'No fuel buffer' };
    }
    
    const buffer = facility.fuelBuffer;
    const currentTime = Date.now();
    const timeDelta = (currentTime - buffer.lastUpdate) / 1000; // 转换为秒
    
    if (!isProducing) {
      buffer.lastUpdate = currentTime;
      return { success: true, energyConsumed: 0 };
    }
    
    // 计算需要消耗的能量
    const energyNeeded = buffer.consumptionRate * timeDelta;
    
    // 从燃料槽中消耗能量
    let remainingNeed = energyNeeded;
    const slotsToRemove: number[] = [];
    
    for (let i = 0; i < buffer.slots.length && remainingNeed > 0; i++) {
      const slot = buffer.slots[i];
      
      if (slot.remainingEnergy >= remainingNeed) {
        slot.remainingEnergy -= remainingNeed;
        remainingNeed = 0;
      } else {
        remainingNeed -= slot.remainingEnergy;
        slot.remainingEnergy = 0;
        slot.quantity--;
        
        if (slot.quantity <= 0) {
          slotsToRemove.push(i);
        } else {
          // 重新填充能量（下一个物品）
          const fuelItem = this.dataService.getItem(slot.itemId);
          if (fuelItem?.fuel?.value) {
            slot.remainingEnergy = fuelItem.fuel.value;
          }
        }
      }
    }
    
    // 移除空槽位
    slotsToRemove.reverse().forEach(index => {
      buffer.slots.splice(index, 1);
    });
    
    // 更新总能量
    buffer.totalEnergy = this.calculateTotalEnergy(buffer);
    buffer.lastUpdate = currentTime;
    
    if (remainingNeed > 0) {
      return { 
        success: false, 
        reason: 'Insufficient fuel',
        energyConsumed: energyNeeded - remainingNeed 
      };
    }
    
    return { success: true, energyConsumed: energyNeeded };
  }
  
  /**
   * 添加燃料到缓存区
   */
  addFuel(
    buffer: FuelBuffer, 
    itemId: string, 
    quantity: number
  ): AddFuelResult {
    const item = this.dataService.getItem(itemId);
    if (!item?.fuel) {
      return { success: false, reason: 'Not a fuel item' };
    }
    
    const facilityConfig = this.getFacilityConfigByBuffer(buffer);
    if (!facilityConfig.acceptedCategories.includes(item.fuel.category)) {
      return { success: false, reason: 'Fuel type not accepted' };
    }
    
    // 查找现有槽位
    let slot = buffer.slots.find(s => s.itemId === itemId);
    
    if (!slot && buffer.slots.length >= buffer.maxSlots) {
      return { success: false, reason: 'No empty fuel slots' };
    }
    
    if (!slot) {
      slot = {
        itemId,
        quantity: 0,
        remainingEnergy: item.fuel.value
      };
      buffer.slots.push(slot);
    }
    
    // 计算可以添加的数量
    const maxStack = facilityConfig.maxStackPerSlot;
    const canAdd = Math.min(quantity, maxStack - slot.quantity);
    
    if (canAdd <= 0) {
      return { success: false, reason: 'Fuel slot is full' };
    }
    
    slot.quantity += canAdd;
    buffer.totalEnergy = this.calculateTotalEnergy(buffer);
    
    return { 
      success: true, 
      quantityAdded: canAdd,
      quantityRemaining: quantity - canAdd
    };
  }
  
  /**
   * 自动补充燃料
   */
  autoRefuel(
    facility: FacilityInstance,
    getInventoryItem: (itemId: string) => InventoryItem
  ): AutoRefuelResult {
    if (!facility.fuelBuffer) {
      return { success: false, itemsConsumed: {} };
    }
    
    const buffer = facility.fuelBuffer;
    const itemsConsumed: Record<string, number> = {};
    
    // 按优先级尝试添加燃料
    for (const fuelId of FUEL_PRIORITY) {
      const inventory = getInventoryItem(fuelId);
      if (inventory.currentAmount <= 0) continue;
      
      const result = this.addFuel(buffer, fuelId, inventory.currentAmount);
      if (result.success && result.quantityAdded) {
        itemsConsumed[fuelId] = result.quantityAdded;
      }
      
      // 如果燃料槽已满，停止添加
      if (buffer.slots.length >= buffer.maxSlots && 
          buffer.slots.every(s => s.quantity >= FACILITY_FUEL_CONFIGS[facility.facilityId].maxStackPerSlot)) {
        break;
      }
    }
    
    return { 
      success: Object.keys(itemsConsumed).length > 0,
      itemsConsumed 
    };
  }
  
  /**
   * 获取燃料状态信息
   */
  getFuelStatus(buffer: FuelBuffer): FuelStatus {
    const totalEnergy = this.calculateTotalEnergy(buffer);
    const runTime = buffer.consumptionRate > 0 
      ? totalEnergy / buffer.consumptionRate 
      : Infinity;
    
    return {
      totalEnergy,
      maxEnergy: buffer.maxEnergy,
      fillPercentage: (totalEnergy / buffer.maxEnergy) * 100,
      estimatedRunTime: runTime,
      isEmpty: buffer.slots.length === 0,
      isFull: buffer.slots.length >= buffer.maxSlots && 
              buffer.slots.every(s => s.quantity >= 50) // TODO: 使用配置
    };
  }
  
  private calculateTotalEnergy(buffer: FuelBuffer): number {
    return buffer.slots.reduce((total, slot) => {
      const item = this.dataService.getItem(slot.itemId);
      const energyPerItem = item?.fuel?.value || 0;
      return total + slot.remainingEnergy + (energyPerItem * (slot.quantity - 1));
    }, 0);
  }
  
  private calculateMaxEnergy(config: FuelConfig): number {
    // 假设最大能量 = 槽位数 * 每槽最大堆叠 * 最高能量燃料
    // 这里简化为固定值，实际可以动态计算
    return config.fuelSlots * config.maxStackPerSlot * 100; // 假设最高100MJ
  }
  
  private getFacilityConfigByBuffer(buffer: FuelBuffer): FuelConfig {
    // 这里需要根据buffer反查配置，实际实现时可能需要在buffer中存储facilityId
    return FACILITY_FUEL_CONFIGS['stone-furnace']; // 临时实现
  }
}

// 类型定义
interface FuelUpdateResult {
  success: boolean;
  reason?: string;
  energyConsumed?: number;
}

interface AddFuelResult {
  success: boolean;
  reason?: string;
  quantityAdded?: number;
  quantityRemaining?: number;
}

interface AutoRefuelResult {
  success: boolean;
  itemsConsumed: Record<string, number>;
}

interface FuelStatus {
  totalEnergy: number;
  maxEnergy: number;
  fillPercentage: number;
  estimatedRunTime: number; // 秒
  isEmpty: boolean;
  isFull: boolean;
}
```

## 5. UI 组件设计

### 5.1 燃料状态显示组件

```typescript
// src/components/facilities/FuelStatusDisplay.tsx
import React from 'react';
import { Box, Typography, LinearProgress, Tooltip, Chip } from '@mui/material';
import { LocalFireDepartment, Timer } from '@mui/icons-material';
import type { FuelBuffer } from '../../types/facilities';
import { FuelService } from '../../services/FuelService';
import FactorioIcon from '../common/FactorioIcon';

interface FuelStatusDisplayProps {
  fuelBuffer: FuelBuffer;
  facilityId: string;
  compact?: boolean;
}

export const FuelStatusDisplay: React.FC<FuelStatusDisplayProps> = ({
  fuelBuffer,
  facilityId,
  compact = false
}) => {
  const fuelService = FuelService.getInstance();
  const status = fuelService.getFuelStatus(fuelBuffer);
  
  const formatTime = (seconds: number): string => {
    if (seconds === Infinity) return '∞';
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分`;
    return `${Math.floor(seconds / 3600)}时`;
  };
  
  const getProgressColor = (percentage: number): 'error' | 'warning' | 'success' => {
    if (percentage < 20) return 'error';
    if (percentage < 50) return 'warning';
    return 'success';
  };
  
  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <LocalFireDepartment fontSize="small" color="action" />
        <LinearProgress
          variant="determinate"
          value={status.fillPercentage}
          color={getProgressColor(status.fillPercentage)}
          sx={{ width: 60, height: 6 }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatTime(status.estimatedRunTime)}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.5}>
          <LocalFireDepartment fontSize="small" />
          燃料状态
        </Typography>
        <Chip
          icon={<Timer />}
          label={`剩余: ${formatTime(status.estimatedRunTime)}`}
          size="small"
          color={status.isEmpty ? 'error' : 'default'}
        />
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={status.fillPercentage}
        color={getProgressColor(status.fillPercentage)}
        sx={{ height: 8, borderRadius: 1, mb: 1 }}
      />
      
      <Box display="flex" gap={1} flexWrap="wrap">
        {fuelBuffer.slots.map((slot, index) => (
          <Tooltip
            key={index}
            title={`${slot.quantity}个 - ${slot.remainingEnergy.toFixed(1)} MJ`}
          >
            <Box position="relative">
              <FactorioIcon
                itemId={slot.itemId}
                size={32}
                quantity={slot.quantity}
              />
            </Box>
          </Tooltip>
        ))}
        
        {/* 空槽位 */}
        {Array.from({ length: fuelBuffer.maxSlots - fuelBuffer.slots.length }).map((_, i) => (
          <Box
            key={`empty-${i}`}
            sx={{
              width: 32,
              height: 32,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LocalFireDepartment fontSize="small" color="disabled" />
          </Box>
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        能量: {status.totalEnergy.toFixed(1)} / {status.maxEnergy} MJ
      </Typography>
    </Box>
  );
};
```

### 5.2 设施卡片中集成燃料显示

```typescript
// 修改 RecipeFacilitiesCard.tsx
import { FuelStatusDisplay } from './FuelStatusDisplay';

// 在设施卡片中添加燃料状态显示
{facilityInstance.fuelBuffer && (
  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
    <FuelStatusDisplay
      fuelBuffer={facilityInstance.fuelBuffer}
      facilityId={facilityType}
      compact={true}
    />
  </Box>
)}
```

## 6. 游戏循环集成

### 6.1 生产循环中的燃料检查

```typescript
// src/hooks/useProductionLoop.ts
export const useProductionLoop = () => {
  const { facilities, updateFacility } = useGameStore();
  const fuelService = FuelService.getInstance();
  
  const updateProduction = useCallback((deltaTime: number) => {
    facilities.forEach(facility => {
      // 检查是否需要燃料
      if (facility.fuelBuffer) {
        // 更新燃料消耗
        const fuelResult = fuelService.updateFuelConsumption(
          facility, 
          deltaTime,
          facility.status === 'running'
        );
        
        // 燃料不足时停止生产
        if (!fuelResult.success && facility.status === 'running') {
          updateFacility(facility.id, { 
            status: 'no_fuel',
            production: { ...facility.production, progress: facility.production?.progress || 0 }
          });
          
          // 尝试自动补充燃料
          const refuelResult = fuelService.autoRefuel(facility, getInventoryItem);
          if (refuelResult.success) {
            // 扣除库存
            Object.entries(refuelResult.itemsConsumed).forEach(([itemId, amount]) => {
              updateInventory(itemId, -amount);
            });
            
            // 恢复运行
            updateFacility(facility.id, { status: 'running' });
          }
        }
      }
      
      // 继续原有的生产逻辑...
    });
  }, [facilities, updateFacility]);
  
  return { updateProduction };
};
```

## 7. 状态管理集成

### 7.1 更新 GameStore

```typescript
// src/store/gameStore.ts
// 在 addFacility 方法中初始化燃料缓存
addFacility: (facility) => {
  const fuelService = FuelService.getInstance();
  
  // 检查是否需要燃料缓存
  const facilityData = DataService.getInstance().getItem(facility.facilityId);
  if (facilityData?.powerType === 'fuel') {
    facility.fuelBuffer = fuelService.initializeFuelBuffer(facility.facilityId);
  }
  
  set((state) => ({
    facilities: [...state.facilities, facility]
  }));
},

// 添加燃料管理方法
refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => {
  const facility = get().facilities.find(f => f.id === facilityId);
  if (!facility?.fuelBuffer) return false;
  
  const fuelService = FuelService.getInstance();
  const result = fuelService.addFuel(facility.fuelBuffer, fuelItemId, quantity);
  
  if (result.success && result.quantityAdded) {
    // 从库存扣除
    get().updateInventory(fuelItemId, -result.quantityAdded);
    
    // 更新设施
    get().updateFacility(facilityId, { fuelBuffer: facility.fuelBuffer });
    
    return true;
  }
  
  return false;
},
```

## 8. 性能优化策略

1. **批量更新**：每秒更新一次，而不是每帧更新
2. **惰性计算**：只在需要时计算燃料状态
3. **缓存结果**：缓存常用计算结果
4. **分组处理**：将相同类型的设施分组处理

## 9. 测试计划

1. **单元测试**：
   - 燃料消耗计算
   - 自动补充逻辑
   - 边界条件处理

2. **集成测试**：
   - 多设施燃料管理
   - 库存与燃料系统交互
   - UI更新响应

3. **性能测试**：
   - 大量设施的燃料更新
   - 内存使用情况
   - 更新频率优化

## 10. 未来扩展

1. **燃料效率研究**：通过科技提升燃料利用率
2. **混合燃料**：支持同时使用多种燃料
3. **燃料管道**：自动化燃料配送系统
4. **余热利用**：将废热转化为额外能量
5. **智能燃料选择**：根据任务自动选择最优燃料