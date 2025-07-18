export interface IconData {
  id: string;
  position: string;
  color: string;
}

// 从data.json中提取的图标数据
export const iconData: IconData[] = [
  {
    "id": "wooden-chest",
    "position": "0px 0px",
    "color": "#937139"
  },
  {
    "id": "iron-chest",
    "position": "-66px 0px",
    "color": "#7c6c5f"
  },
  {
    "id": "steel-chest",
    "position": "0px -66px",
    "color": "#85787b"
  },
  {
    "id": "storage-tank",
    "position": "-66px -66px",
    "color": "#7d715c"
  },
  {
    "id": "wood",
    "position": "-462px -594px",
    "color": "#926634"
  },
  {
    "id": "coal",
    "position": "-528px -594px",
    "color": "#322e2b"
  },
  {
    "id": "stone",
    "position": "-594px -594px",
    "color": "#8b7754"
  },
  {
    "id": "iron-ore",
    "position": "-660px 0px",
    "color": "#5d7682"
  },
  {
    "id": "copper-ore",
    "position": "-660px -66px",
    "color": "#a96844"
  },
  {
    "id": "iron-plate",
    "position": "-660px -264px",
    "color": "#8f8f8f"
  },
  {
    "id": "copper-plate",
    "position": "-660px -330px",
    "color": "#bc7760"
  },
  {
    "id": "steel-plate",
    "position": "-660px -462px",
    "color": "#858581"
  },
  {
    "id": "copper-cable",
    "position": "-132px -660px",
    "color": "#b87b62"
  },
  {
    "id": "iron-stick",
    "position": "-198px -660px",
    "color": "#868786"
  },
  {
    "id": "iron-gear-wheel",
    "position": "-264px -660px",
    "color": "#6e6f6a"
  },
  {
    "id": "electronic-circuit",
    "position": "-396px -660px",
    "color": "#7f9649"
  },
  {
    "id": "advanced-circuit",
    "position": "-462px -660px",
    "color": "#b36e49"
  },
  {
    "id": "processing-unit",
    "position": "-528px -660px",
    "color": "#7c7db2"
  }
];

// 图标尺寸常量
export const ICON_SIZE = 66; // 每个图标是66x66像素

// 获取图标数据的工具函数
export const getIconData = (iconId: string): IconData | undefined => {
  for (let i = 0; i < iconData.length; i++) {
    if (iconData[i].id === iconId) {
      return iconData[i];
    }
  }
  return undefined;
};

// 解析位置字符串为x,y坐标
export const parsePosition = (position: string): { x: number; y: number } => {
  const [x, y] = position.split(' ').map(coord => parseInt(coord.replace('px', '')));
  return { x: Math.abs(x), y: Math.abs(y) };
}; 