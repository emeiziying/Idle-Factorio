# 手动制作判断流程图

## 主流程

```mermaid
flowchart TD
    Start([开始判断物品是否可手动制作]) --> CheckItem{物品是否存在?}
    
    CheckItem -->|否| NotExist[返回: 物品不存在]
    CheckItem -->|是| GetRecipes[获取物品的所有配方]
    
    GetRecipes --> CheckRecipeCount{配方数量 = 0?}
    
    CheckRecipeCount -->|是| RawMaterial[原材料<br/>可以手动采集]
    CheckRecipeCount -->|否| CheckEachRecipe[逐个检查配方]
    
    CheckEachRecipe --> HasManualRecipe{存在可手动制作的配方?}
    
    HasManualRecipe -->|是| CanCraft[可以手动制作]
    HasManualRecipe -->|否| NeedEquipment[需要生产设备]
    
    RawMaterial --> End([结束])
    CanCraft --> End
    NeedEquipment --> End
    NotExist --> End
```

## 配方验证流程

```mermaid
flowchart TD
    StartRecipe([开始验证配方]) --> CheckFlags{检查配方标志}
    
    CheckFlags -->|mining标志| Mining[采矿配方<br/>可手动采集]
    CheckFlags -->|recycling标志| Recycling[回收配方<br/>可手动制作]
    CheckFlags -->|无特殊标志| CheckProducers[检查生产者限制]
    
    CheckProducers --> HasRestricted{包含受限生产者?}
    
    HasRestricted -->|是| ProducerRestricted[需要特殊设备<br/>不能手动制作]
    HasRestricted -->|否| CheckFluid[检查流体材料]
    
    CheckFluid --> HasFluid{输入包含流体?}
    
    HasFluid -->|是| FluidRestricted[包含流体<br/>不能手动制作]
    HasFluid -->|否| CheckSpecial[检查特殊物品]
    
    CheckSpecial --> IsSpecial{是特殊限制物品?}
    
    IsSpecial -->|是| SpecialRestricted[高级物品<br/>不能手动制作]
    IsSpecial -->|否| DefaultCraftable[默认可手动制作]
    
    Mining --> CanManual([可以手动制作])
    Recycling --> CanManual
    DefaultCraftable --> CanManual
    
    ProducerRestricted --> CannotManual([不能手动制作])
    FluidRestricted --> CannotManual
    SpecialRestricted --> CannotManual
```

## 受限生产者列表

```mermaid
graph LR
    subgraph 熔炉类
        A1[stone-furnace<br/>石炉]
        A2[steel-furnace<br/>钢炉]
        A3[electric-furnace<br/>电炉]
    end
    
    subgraph 装配机类
        B1[assembling-machine-1<br/>装配机1型]
        B2[assembling-machine-2<br/>装配机2型]
        B3[assembling-machine-3<br/>装配机3型]
    end
    
    subgraph 化工设备类
        C1[chemical-plant<br/>化工厂]
        C2[oil-refinery<br/>炼油厂]
        C3[centrifuge<br/>离心机]
    end
    
    subgraph 流体设备类
        D1[pumpjack<br/>抽油机]
        D2[offshore-pump<br/>水泵]
    end
```

## UI显示决策流程

```mermaid
flowchart TD
    GetItem([获取物品信息]) --> GetAllRecipes[获取所有配方]
    
    GetAllRecipes --> NoRecipe{配方数量 = 0?}
    
    NoRecipe -->|是| ShowRawMaterial[显示原材料采集界面<br/>"无需材料"]
    NoRecipe -->|否| FilterRecipes[筛选配方类型]
    
    FilterRecipes --> SplitRecipes[分离配方]
    
    SplitRecipes --> ManualRecipes[可手动制作的配方]
    SplitRecipes --> RestrictedRecipes[需要设备的配方]
    
    ManualRecipes --> HasManual{有可手动制作的配方?}
    
    HasManual -->|是| ShowManualSection[显示手动合成区域<br/>显示第一个可用配方]
    HasManual -->|否| CheckRestricted{有需要设备的配方?}
    
    RestrictedRecipes --> CheckUnlocked{检查设备是否解锁}
    
    CheckUnlocked -->|已解锁| ShowProducerSection[显示生产设备配方区域]
    CheckUnlocked -->|未解锁| HideSection[隐藏该区域]
    
    CheckRestricted -->|是| ShowWarning[显示设备需求提示]
    CheckRestricted -->|否| ShowNoRecipe[显示"无可用配方"]
```

## 实例判断流程

### 示例1: 木材 (wood)

```mermaid
flowchart LR
    Wood[木材] --> Check1{有配方?}
    Check1 -->|否| Result1[原材料<br/>可手动采集]
```

### 示例2: 木板 (wood-plank)

```mermaid
flowchart LR
    WoodPlank[木板] --> Check2{有配方?}
    Check2 -->|是| Recipe[配方: 木材→木板]
    Recipe --> Validate{验证配方}
    Validate -->|无限制| Result2[可手动制作]
```

### 示例3: 钢材 (steel-plate)

```mermaid
flowchart LR
    Steel[钢材] --> Check3{有配方?}
    Check3 -->|是| Recipe3[配方: 铁板→钢板]
    Recipe3 --> Validate3{验证配方}
    Validate3 -->|需要熔炉| Result3[不能手动制作<br/>需要熔炉]
```

### 示例4: 塑料 (plastic-bar)

```mermaid
flowchart LR
    Plastic[塑料] --> Check4{有配方?}
    Check4 -->|是| Recipe4[配方: 石油气+煤→塑料]
    Recipe4 --> Validate4{验证配方}
    Validate4 -->|需要化工厂<br/>+包含流体| Result4[不能手动制作<br/>需要化工厂]
```