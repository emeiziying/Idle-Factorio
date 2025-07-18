const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function generatePreviews() {
  console.log('Starting preview generation...');
  
  // First, create a simple HTML file that showcases the React Native components
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>异星工厂手机版 - 预览</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 375px; margin: 0 auto; background: white; min-height: 100vh; }
    
    /* 主屏幕样式 */
    .main-screen { padding: 0; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .stats { display: flex; justify-content: space-around; margin-top: 15px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 20px; font-weight: bold; }
    .stat-label { font-size: 12px; opacity: 0.8; }
    
    .categories { display: flex; overflow-x: auto; padding: 10px; gap: 10px; background: #ecf0f1; }
    .category-tab { padding: 8px 16px; background: white; border-radius: 20px; white-space: nowrap; cursor: pointer; }
    .category-tab.active { background: #3498db; color: white; }
    
    .items-grid { padding: 15px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .item-card { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .item-icon { width: 60px; height: 60px; background: #3498db; border-radius: 10px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 30px; }
    .item-name { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
    .item-count { font-size: 12px; color: #666; }
    
    /* 详情屏幕样式 */
    .detail-screen { padding: 0; }
    .detail-header { background: #34495e; color: white; padding: 20px; }
    .back-button { font-size: 14px; margin-bottom: 10px; cursor: pointer; }
    .detail-content { padding: 20px; }
    .detail-icon { width: 100px; height: 100px; background: #3498db; border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 50px; }
    .detail-stats { background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
    .detail-stat-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .detail-stat-row:last-child { margin-bottom: 0; }
    
    .recipe-section { margin-top: 20px; }
    .recipe-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; }
    .recipe-item { display: flex; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; }
    .recipe-icon { width: 40px; height: 40px; background: #e74c3c; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; }
    
    .craft-button { background: #27ae60; color: white; padding: 15px; border-radius: 10px; text-align: center; font-size: 16px; font-weight: 600; margin-top: 20px; cursor: pointer; }
    
    .floating-queue { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: #e67e22; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div id="main-screen" class="container">
    <div class="main-screen">
      <div class="header">
        <h1>异星工厂</h1>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-value">1,234</div>
            <div class="stat-label">总资源</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">56</div>
            <div class="stat-label">生产中</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">12</div>
            <div class="stat-label">等级</div>
          </div>
        </div>
      </div>
      
      <div class="categories">
        <div class="category-tab active">基础资源</div>
        <div class="category-tab">中级材料</div>
        <div class="category-tab">高级部件</div>
        <div class="category-tab">科技</div>
      </div>
      
      <div class="items-grid">
        <div class="item-card">
          <div class="item-icon">⚙️</div>
          <div class="item-name">铁板</div>
          <div class="item-count">256 个</div>
        </div>
        <div class="item-card">
          <div class="item-icon">🔩</div>
          <div class="item-name">铜板</div>
          <div class="item-count">128 个</div>
        </div>
        <div class="item-card">
          <div class="item-icon">⚡</div>
          <div class="item-name">电路板</div>
          <div class="item-count">64 个</div>
        </div>
        <div class="item-card">
          <div class="item-icon">🏭</div>
          <div class="item-name">组装机</div>
          <div class="item-count">8 个</div>
        </div>
      </div>
      
      <div class="floating-queue">3</div>
    </div>
  </div>
  
  <div id="detail-screen" class="container" style="display: none;">
    <div class="detail-screen">
      <div class="detail-header">
        <div class="back-button">← 返回</div>
        <h2>电路板</h2>
      </div>
      
      <div class="detail-content">
        <div class="detail-icon">⚡</div>
        
        <div class="detail-stats">
          <div class="detail-stat-row">
            <span>当前数量：</span>
            <span><strong>64</strong> 个</span>
          </div>
          <div class="detail-stat-row">
            <span>存储上限：</span>
            <span>1000 个</span>
          </div>
          <div class="detail-stat-row">
            <span>生产速度：</span>
            <span>2 个/秒</span>
          </div>
        </div>
        
        <div class="recipe-section">
          <div class="recipe-title">配方需求</div>
          <div class="recipe-item">
            <div class="recipe-icon">⚙️</div>
            <div>铁板 x 1</div>
          </div>
          <div class="recipe-item">
            <div class="recipe-icon">🔩</div>
            <div>铜线 x 3</div>
          </div>
        </div>
        
        <div class="craft-button">制作 10 个</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  // Write HTML file
  const htmlPath = path.join(__dirname, 'preview.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  // Launch Puppeteer and take screenshots
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2
  });
  
  // Load the HTML file
  await page.goto(`file://${htmlPath}`);
  
  // Screenshot 1: Main screen
  await page.screenshot({
    path: path.join(screenshotsDir, 'main-screen.png'),
    fullPage: false
  });
  console.log('Generated: main-screen.png');
  
  // Show detail screen and hide main screen
  await page.evaluate(() => {
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('detail-screen').style.display = 'block';
  });
  
  // Screenshot 2: Detail screen
  await page.screenshot({
    path: path.join(screenshotsDir, 'detail-screen.png'),
    fullPage: false
  });
  console.log('Generated: detail-screen.png');
  
  await browser.close();
  
  // Clean up temporary HTML file
  fs.unlinkSync(htmlPath);
  
  console.log('\n✅ 预览图生成完成！');
  console.log(`📁 图片保存在: ${screenshotsDir}`);
}

// Run the script
generatePreviews().catch(console.error);