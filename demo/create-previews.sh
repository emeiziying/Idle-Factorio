#!/bin/bash

echo "Creating preview HTML files..."

# Create preview directory
mkdir -p previews

# Main screen HTML
cat > previews/main-screen.html << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>异星工厂 - 主界面</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .screen { width: 375px; height: 812px; background: #f5f5f5; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .header h1 { font-size: 24px; margin-bottom: 15px; }
        .stats { display: flex; justify-content: space-around; }
        .stat { text-align: center; }
        .stat-value { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 12px; opacity: 0.8; }
        .tabs { display: flex; gap: 10px; padding: 15px; background: #ecf0f1; }
        .tab { padding: 8px 16px; background: white; border-radius: 20px; font-size: 14px; }
        .tab.active { background: #3498db; color: white; }
        .items { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .item { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .icon { font-size: 40px; margin-bottom: 10px; }
        .item-name { font-weight: 600; margin-bottom: 5px; }
        .item-count { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="screen">
        <div class="header">
            <h1>异星工厂</h1>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">1,234</div>
                    <div class="stat-label">总资源</div>
                </div>
                <div class="stat">
                    <div class="stat-value">56</div>
                    <div class="stat-label">生产中</div>
                </div>
                <div class="stat">
                    <div class="stat-value">12</div>
                    <div class="stat-label">等级</div>
                </div>
            </div>
        </div>
        <div class="tabs">
            <div class="tab active">基础资源</div>
            <div class="tab">中级材料</div>
            <div class="tab">高级部件</div>
            <div class="tab">科技</div>
        </div>
        <div class="items">
            <div class="item">
                <div class="icon">⚙️</div>
                <div class="item-name">铁板</div>
                <div class="item-count">256 个</div>
            </div>
            <div class="item">
                <div class="icon">🔩</div>
                <div class="item-name">铜板</div>
                <div class="item-count">128 个</div>
            </div>
            <div class="item">
                <div class="icon">⚡</div>
                <div class="item-name">电路板</div>
                <div class="item-count">64 个</div>
            </div>
            <div class="item">
                <div class="icon">🏭</div>
                <div class="item-name">组装机</div>
                <div class="item-count">8 个</div>
            </div>
        </div>
    </div>
</body>
</html>
HTML

# Detail screen HTML
cat > previews/detail-screen.html << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>异星工厂 - 详情界面</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .screen { width: 375px; height: 812px; background: #f5f5f5; margin: 0 auto; }
        .header { background: #34495e; color: white; padding: 20px; }
        .back { font-size: 14px; margin-bottom: 10px; }
        .content { padding: 20px; background: white; }
        .icon { font-size: 80px; text-align: center; margin: 20px 0; }
        .stats { background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .recipe { margin-top: 20px; }
        .recipe h3 { margin-bottom: 15px; }
        .recipe-item { display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; }
        .recipe-icon { font-size: 24px; margin-right: 15px; }
        .craft-btn { background: #27ae60; color: white; padding: 15px; text-align: center; border-radius: 10px; margin-top: 20px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="screen">
        <div class="header">
            <div class="back">← 返回</div>
            <h2>电路板</h2>
        </div>
        <div class="content">
            <div class="icon">⚡</div>
            <div class="stats">
                <div class="stat-row">
                    <span>当前数量：</span>
                    <span><strong>64</strong> 个</span>
                </div>
                <div class="stat-row">
                    <span>存储上限：</span>
                    <span>1000 个</span>
                </div>
                <div class="stat-row">
                    <span>生产速度：</span>
                    <span>2 个/秒</span>
                </div>
            </div>
            <div class="recipe">
                <h3>配方需求</h3>
                <div class="recipe-item">
                    <span class="recipe-icon">⚙️</span>
                    <span>铁板 x 1</span>
                </div>
                <div class="recipe-item">
                    <span class="recipe-icon">🔩</span>
                    <span>铜线 x 3</span>
                </div>
            </div>
            <div class="craft-btn">制作 10 个</div>
        </div>
    </div>
</body>
</html>
HTML

echo "Preview HTML files created!"
echo ""
echo "To generate screenshots:"
echo "1. Open previews/main-screen.html in your browser"
echo "2. Open previews/detail-screen.html in your browser"
echo "3. Use browser developer tools to set viewport to 375x812"
echo "4. Take screenshots using your preferred tool"
echo ""
echo "Or use this command with puppeteer installed:"
echo "node generate-screenshots.js"
