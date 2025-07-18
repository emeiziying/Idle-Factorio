# 图标系统集成说明

## 概述

本项目已经集成了Factorio 1.1.107的图标数据，包括：
- 图标位置数据 (`src/data/iconData.ts`)
- 精灵图文件 (`assets/icons.webp`)
- 图标组件 (`src/components/GameIcon.tsx`)

## 数据结构

### 图标数据 (iconData.ts)
```typescript
interface IconData {
  id: string;        // 图标ID，对应物品ID
  position: string;  // 精灵图中的位置，如 "-462px -594px"
  color: string;     // 图标主色调，用于占位符显示
}
```

### 已包含的图标
- 存储设备：wooden-chest, iron-chest, steel-chest, storage-tank
- 基础资源：wood, coal, stone, iron-ore, copper-ore
- 加工品：iron-plate, copper-plate, steel-plate
- 中间品：copper-cable, iron-stick, iron-gear-wheel
- 电路：electronic-circuit, advanced-circuit, processing-unit

## 使用方法

### 1. 使用GameIcon组件（推荐）
```typescript
import GameIcon from './components/GameIcon';

// 在组件中使用
<GameIcon iconId="wood" size={32} />
```

### 2. 使用SimpleIcon组件（备用）
```typescript
import SimpleIcon from './components/SimpleIcon';

// 显示颜色块占位符
<SimpleIcon iconId="wood" size={32} />
```

### 3. 获取图标数据
```typescript
import { getIconData } from './data/iconData';

const iconData = getIconData('wood');
if (iconData) {
  console.log('图标位置:', iconData.position);
  console.log('图标颜色:', iconData.color);
}
```

## 技术实现

### 精灵图系统
- 精灵图文件：`assets/icons.webp`
- 图标尺寸：66x66像素
- 位置格式：CSS background-position格式

### 组件实现
1. **GameIcon**: 使用Image组件显示精灵图
2. **SimpleIcon**: 使用颜色块作为占位符
3. **占位符**: 当找不到图标时显示问号

## 添加新图标

### 1. 从data.json提取数据
```bash
# 在data/1.1/data.json中查找图标数据
grep -A 2 '"id": "your-item-id"' data/1.1/data.json
```

### 2. 添加到iconData.ts
```typescript
{
  "id": "your-item-id",
  "position": "-xpx -ypx",
  "color": "#hexcolor"
}
```

### 3. 确保精灵图包含该图标
- 检查`assets/icons.webp`是否包含该图标
- 验证位置坐标是否正确

## 故障排除

### TypeScript配置问题
当前项目存在TypeScript配置问题，导致JSX无法正常工作。解决方案：

1. 更新tsconfig.json：
```json
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "*": ["src/*"]
    }
  }
}
```

2. 或者使用JavaScript文件：
   - 将.tsx文件重命名为.js
   - 移除TypeScript类型注解

### 图标不显示
1. 检查图标ID是否正确
2. 确认iconData.ts中是否包含该图标
3. 验证精灵图文件是否存在
4. 检查位置坐标是否正确

## 性能优化

### 图标缓存
- React Native会自动缓存Image组件
- 精灵图只需加载一次

### 内存使用
- 使用精灵图减少HTTP请求
- 图标组件支持自定义尺寸

## 扩展功能

### 动画图标
可以添加动画效果：
```typescript
// 在GameIcon组件中添加动画
const animatedValue = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);
```

### 图标状态
可以添加不同状态的图标：
```typescript
interface GameIconProps {
  iconId: string;
  size?: number;
  state?: 'normal' | 'hover' | 'active' | 'disabled';
}
```

## 总结

图标系统已经完整集成，包括：
- ✅ 图标数据提取和整理
- ✅ 精灵图文件复制
- ✅ 基础组件实现
- ⚠️ TypeScript配置需要修复
- ⚠️ 组件集成需要完善

修复TypeScript配置后，就可以在ItemCard等组件中使用真实的Factorio图标了。 