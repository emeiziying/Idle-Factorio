import { Entities } from '@/models';
import * as M from './factorio.models';

export interface ModList {
  mods: { name: string; enabled: boolean }[];
}

export interface PlayerData {
  'last-played-version': {
    game_version: string;
    build_version: number;
    build_mode: string;
    platform: string;
  };
}

export type EffectType = 'speed' | 'productivity' | 'consumption' | 'pollution';

export const allEffects: EffectType[] = [
  'consumption',
  'speed',
  'productivity',
  'pollution',
];

export function isSimpleIngredient(
  value: M.IngredientPrototype
): value is [string, number] {
  return Array.isArray(value);
}

export function isFluidIngredient(
  value: M.IngredientPrototype
): value is M.FluidIngredientPrototype {
  return !Array.isArray(value) && value.type === 'fluid';
}

export function isSimpleProduct(
  value: M.ProductPrototype
): value is [string, number] {
  return Array.isArray(value);
}

export function isFluidProduct(
  value: M.ProductPrototype
): value is M.FluidProductPrototype {
  return !Array.isArray(value) && value.type === 'fluid';
}

export interface DataRawDump {
  // 蓄电器
  accumulator: Entities<M.AccumulatorPrototype>;
  // 弹药
  ammo: Entities<M.AmmoItemPrototype>;
  // 炮塔
  'ammo-turret': Entities<M.AmmoTurretPrototype>;
  // 装甲
  armor: Entities<M.ArmorPrototype>;
  // 炮塔
  'artillery-turret': Entities<M.ArtilleryTurretPrototype>;
  // 火炮车
  'artillery-wagon': Entities<M.ArtilleryWagonPrototype>;
  // 装配机
  'assembling-machine': Entities<M.AssemblingMachinePrototype>;
  // 信标
  beacon: Entities<M.BeaconPrototype>;
  // 锅炉
  boiler: Entities<M.BoilerPrototype>;
  // 胶囊
  capsule: Entities<M.CapsulePrototype>;
  // 车
  car: Entities<M.CarPrototype>;
  // 货运车厢
  'cargo-wagon': Entities<M.CargoWagonPrototype>;
  // 容器
  container: Entities<M.ContainerPrototype>;
  // 鱼
  fish: Entities<M.FishPrototype>;
  // 液体
  fluid: Entities<M.FluidPrototype>;
  // 液罐车厢
  'fluid-wagon': Entities<M.FluidWagonPrototype>;
  // 冶炼炉
  furnace: Entities<M.FurnacePrototype>;
  // 利用流体产生动力的实体，例如蒸汽机。
  generator: Entities<M.GeneratorPrototype>;
  // 枪支
  gun: Entities<M.GunPrototype>;
  // 机械臂
  inserter: Entities<M.InserterPrototype>;
  item: Entities<M.ItemPrototype>;
  'item-group': Entities<M.ItemGroup>;
  'item-subgroup': Entities<M.ItemSubGroup>;
  'item-with-entity-data': Entities<M.ItemWithEntityDataPrototype>;
  'item-with-tags': Entities<M.ItemWithTagsPrototype>;
  // 研究中心
  lab: Entities<M.LabPrototype>;
  // 地雷
  'land-mine': Entities<M.LandMinePrototype>;
  // 内燃机车
  locomotive: Entities<M.LocomotivePrototype>;
  // 采矿机
  'mining-drill': Entities<M.MiningDrillPrototype>;
  module: Entities<M.ModulePrototype>;
  // 水泵
  'offshore-pump': Entities<M.OffshorePumpPrototype>;
  // 管道泵
  pump: Entities<M.PumpPrototype>;
  // 雷达
  radar: Entities<M.RadarPrototype>;
  'rail-planner': Entities<M.RailPlannerPrototype>;
  // 反应堆
  reactor: Entities<M.ReactorPrototype>;
  recipe: Entities<M.RecipePrototype>;
  // 修理工具
  'repair-tool': Entities<M.RepairToolPrototype>;
  // 资源
  resource: Entities<M.ResourceEntityPrototype>;
  // 火箭发射井
  'rocket-silo': Entities<M.RocketSiloPrototype>;
  //
  'rocket-silo-rocket': Entities<M.RocketSiloRocketPrototype>;
  'selection-tool': Entities<M.SelectionToolPrototype>;
  'simple-entity': Entities<M.SimpleEntityPrototype>;
  'simple-entity-with-force': Entities<M.SimpleEntityWithForcePrototype>;
  'simple-entity-with-owner': Entities<M.SimpleEntityWithOwnerPrototype>;
  'spidertron-remote': Entities<M.SpidertronRemotePrototype>;
  // 储液罐
  'storage-tank': Entities<M.StorageTankPrototype>;
  technology: Entities<M.TechnologyPrototype>;
  tool: Entities<M.ToolPrototype>;
  tree: Entities<M.TreePrototype>;
  // 炮塔
  turret: Entities<M.TurretPrototype>;
  'transport-belt': Entities<M.TransportBeltPrototype>;
  wall: Entities<M.WallPrototype>;
}

export interface Locale {
  names: Entities<string>;
}

export type AnyItemPrototype =
  | M.AmmoItemPrototype
  | M.ArmorPrototype
  | M.CapsulePrototype
  | M.GunPrototype
  | M.ItemPrototype
  | M.ItemWithEntityDataPrototype
  | M.ItemWithTagsPrototype
  | M.ModulePrototype
  | M.RailPlannerPrototype
  | M.RepairToolPrototype
  | M.SelectionToolPrototype
  | M.SpidertronRemotePrototype
  | M.ToolPrototype;

export function isAnyItemPrototype(proto: unknown): proto is AnyItemPrototype {
  return (
    M.isAmmoItemPrototype(proto) ||
    M.isArmorPrototype(proto) ||
    M.isCapsulePrototype(proto) ||
    M.isGunPrototype(proto) ||
    M.isItemPrototype(proto) ||
    M.isItemWithEntityDataPrototype(proto) ||
    M.isItemWithTagsPrototype(proto) ||
    M.isModulePrototype(proto) ||
    M.isRailPlannerPrototype(proto) ||
    M.isRepairToolPrototype(proto) ||
    M.isSelectionToolPrototype(proto) ||
    M.isSpidertronRemotePrototype(proto) ||
    M.isToolPrototype(proto)
  );
}

export type AnyEntityPrototype =
  | M.BeaconPrototype
  | M.AssemblingMachinePrototype
  | M.BoilerPrototype
  | M.FurnacePrototype
  | M.LabPrototype
  | M.MiningDrillPrototype
  | M.OffshorePumpPrototype
  | M.ReactorPrototype
  | M.RocketSiloPrototype
  | M.TransportBeltPrototype
  | M.CargoWagonPrototype
  | M.FluidWagonPrototype;

export interface ModDataReport {
  noProducers: string[];
  noProducts: string[];
  resourceNoMinableProducts: string[];
  resourceDuplicate: string[];
}

export type MachineProto =
  | M.BoilerPrototype
  | M.AssemblingMachinePrototype
  | M.RocketSiloPrototype
  | M.FurnacePrototype
  | M.LabPrototype
  | M.MiningDrillPrototype
  | M.OffshorePumpPrototype
  | M.ReactorPrototype;

export const anyEntityKeys = [
  'beacon',
  'assembling-machine',
  'boiler',
  'furnace',
  'lab',
  'mining-drill',
  'offshore-pump',
  'reactor',
  'rocket-silo',
  'transport-belt',
  'cargo-wagon',
  'fluid-wagon',
] as const;

export const anyItemKeys = [
  'item',
  'ammo',
  'armor',
  'capsule',
  'gun',
  'item-with-entity-data',
  'item-with-tags',
  'module',
  'rail-planner',
  'repair-tool',
  'selection-tool',
  'spidertron-remote',
  'tool',
  'fluid',
] as const;
