import { useState, useEffect, useRef, useMemo } from 'react';
import { FacilityLogistics } from '../types/logistics';
import { simpleLogisticsService } from '../services/SimpleLogisticsService';

interface EfficiencyCalculationProps {
  itemId: string;
  facilityType: string;
  facilityCount: number;
  baseProductionRate: number;
  baseConsumptionRate: number;
  inputConfig: any;
  outputConfig: any;
}

// 比较两个配置是否相等
function configEquals(a: any, b: any): boolean {
  if (!a || !b) return false;
  return (
    a.conveyors === b.conveyors &&
    a.conveyorType === b.conveyorType &&
    a.inserters === b.inserters &&
    a.inserterType === b.inserterType
  );
}

export function useEfficiencyCalculation({
  itemId,
  facilityType,
  facilityCount,
  baseProductionRate,
  baseConsumptionRate,
  inputConfig,
  outputConfig,
}: EfficiencyCalculationProps) {
  const [logistics, setLogistics] = useState<FacilityLogistics | null>(null);
  const prevPropsRef = useRef<EfficiencyCalculationProps>();
  const calculationTimeoutRef = useRef<NodeJS.Timeout>();

  // 使用memo缓存计算结果
  const calculatedLogistics = useMemo(() => {
    // 检查是否需要重新计算
    const prevProps = prevPropsRef.current;
    if (prevProps &&
        prevProps.itemId === itemId &&
        prevProps.facilityType === facilityType &&
        prevProps.facilityCount === facilityCount &&
        prevProps.baseProductionRate === baseProductionRate &&
        prevProps.baseConsumptionRate === baseConsumptionRate &&
        configEquals(prevProps.inputConfig, inputConfig) &&
        configEquals(prevProps.outputConfig, outputConfig)) {
      return logistics; // 返回缓存的结果
    }

    // 执行计算
    return simpleLogisticsService.updateFacilityLogistics(
      itemId,
      facilityType,
      facilityCount,
      baseConsumptionRate,
      baseProductionRate,
      inputConfig,
      outputConfig
    );
  }, [itemId, facilityType, facilityCount, baseProductionRate, baseConsumptionRate, inputConfig, outputConfig]);

  useEffect(() => {
    // 清除之前的延迟计算
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // 延迟更新，避免频繁计算
    calculationTimeoutRef.current = setTimeout(() => {
      setLogistics(calculatedLogistics);
      
      // 更新缓存的props
      prevPropsRef.current = {
        itemId,
        facilityType,
        facilityCount,
        baseProductionRate,
        baseConsumptionRate,
        inputConfig,
        outputConfig,
      };
    }, 100); // 100ms防抖

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [calculatedLogistics]);

  return logistics;
}