# 项目概述

## 项目基本信息
- **名称**: 异星工厂 v2 (Factorio v2)
- **类型**: React-based idle factory management game
- **技术栈**: React + TypeScript + Material-UI + Zustand
- **当前状态**: 第一阶段开发中

## 项目结构
根据文档，主要代码应在 `/demo/` 目录下，但当前项目根目录没有此文件夹。
需要确认实际的React应用位置。

## 核心设计理念
一阶段简化设计：
- **简化物流**: 不使用复杂的物流驱动计算
- **自动化生产**: 设施可以自动获取所需材料和添加产出到库存
- **基础生产循环**: 物品 → 制作 → 库存 → 设施管理

## 主要模块
1. **生产模块**: 物品展示、制作系统、库存管理
2. **设施模块**: 设施管理、生产自动化
3. **科技模块**: 研究系统、物品解锁
4. **电力模块**: 电力平衡、发电/耗电管理

## 核心服务
- DataService: 游戏数据加载
- UserProgressService: 物品解锁状态
- FacilityService: 设施管理
- PowerService: 电力系统
- InventoryService: 库存管理（集成在GameStore中）