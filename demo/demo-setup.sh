#!/bin/bash

echo "🚀 异星工厂手机版演示项目设置脚本"
echo "=================================="

# 检查Node.js版本
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js版本过低，需要16+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查React Native CLI
if ! command -v npx react-native &> /dev/null; then
    echo "📦 安装React Native CLI..."
    npm install -g @react-native-community/cli
fi

echo "✅ React Native CLI已安装"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装完成"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 创建必要的目录
echo "📁 创建项目目录..."
mkdir -p android ios

echo "✅ 项目设置完成！"
echo ""
echo "🎮 运行项目:"
echo "  npm start          # 启动Metro服务器"
echo "  npm run android    # 运行Android版本"
echo "  npm run ios        # 运行iOS版本"
echo ""
echo "📱 项目特色:"
echo "  • 物品分类管理"
echo "  • 手工制作队列"
echo "  • 配方系统"
echo "  • 存储管理"
echo "  • 浮动制作队列"
echo ""
echo "🎯 开始体验异星工厂手机版吧！" 