# 推荐命令

## 项目开发命令

### 基础命令
```bash
# 进入demo目录（主要开发目录）
cd demo

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test
```

### 系统命令 (macOS/Darwin)
```bash
# 文件操作
ls -la          # 列出文件（详细信息）
find . -name    # 查找文件
grep -r         # 递归搜索文本

# Git操作
git status      # 查看状态
git add .       # 添加所有更改
git commit -m   # 提交更改
git push        # 推送到远程

# 进程管理
ps aux          # 查看进程
kill -9         # 强制终止进程
```

## 注意事项
- 主要开发工作在 `/demo/` 目录进行
- 当前项目根目录缺少demo文件夹，需要确认实际结构
- 使用TypeScript严格模式开发
- 遵循Material-UI设计规范