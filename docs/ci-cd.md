# CI/CD 配置说明

本项目配置了完整的 GitHub Actions CI/CD 流程，包含代码质量检查、安全扫描和自动部署。

## 📋 工作流概览

### 1. 主要 CI 流程 (`ci.yml`)

**触发条件：**
- 推送到 `main`、`develop`、`next` 分支
- 对上述分支的 Pull Request

**执行步骤：**
- ✅ ESLint 代码检查
- ✅ TypeScript 类型检查
- ✅ 项目构建
- ✅ 构建产物上传

**支持的 Node.js 版本：** 18.x, 20.x

### 2. 安全扫描 (`security.yml`)

**触发条件：**
- 推送到主要分支
- Pull Request
- 每日定时扫描（凌晨 2 点）

**检查内容：**
- 依赖项安全漏洞扫描
- npm audit 安全审计
- 高危和严重漏洞检测

### 3. 自动部署 (`deploy.yml`)

**触发条件：**
- 推送到 `main` 分支
- 手动触发

**部署目标：** GitHub Pages

**部署内容：** 构建后的静态文件

## 🔧 配置详情

### 依赖管理

项目使用 `pnpm` 作为包管理器，CI 中配置了：
- 依赖缓存优化
- Lockfile 验证
- 冻结安装模式

### 安全配置

`audit-ci.json` 配置了安全扫描策略：
- 忽略中等风险漏洞
- 检测高风险和严重漏洞
- 输出摘要报告

## 📊 徽章状态

可以在 README 中添加以下徽章：

```markdown
![CI](https://github.com/your-username/idle-factorio/workflows/CI/badge.svg)
![Security](https://github.com/your-username/idle-factorio/workflows/Security%20Scan/badge.svg)
![Deploy](https://github.com/your-username/idle-factorio/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
```

## 🚀 使用说明

### 启用 GitHub Pages

1. 进入仓库设置 → Pages
2. 选择 "GitHub Actions" 作为部署源
3. 推送到 `main` 分支即可自动部署

### 本地开发

```bash
# 安装依赖
pnpm install

# 代码检查
pnpm run lint

# 类型检查
pnpm exec tsc --noEmit

# 构建项目
pnpm run build
```

### 修复安全漏洞

```bash
# 查看安全问题
pnpm audit

# 自动修复
pnpm audit --fix

# 手动更新依赖
pnpm update
```

## 🔍 故障排除

### CI 失败常见原因

1. **ESLint 错误**
   - 检查代码风格问题
   - 运行 `pnpm run lint` 查看详情

2. **TypeScript 类型错误**
   - 运行 `pnpm exec tsc --noEmit` 本地检查
   - 修复类型定义问题

3. **构建失败**
   - 检查依赖项是否完整
   - 确认构建配置正确

4. **安全扫描失败**
   - 更新有漏洞的依赖项
   - 检查 `audit-ci.json` 配置

### 跳过 CI 检查

在特殊情况下，可以在提交信息中添加：
```
[skip ci]  # 跳过所有 CI
[skip security]  # 跳过安全检查
```

## 📈 未来改进

- [ ] 添加单元测试配置
- [ ] 集成代码覆盖率报告
- [ ] 添加性能测试
- [ ] 配置多环境部署
- [ ] 集成 SonarQube 代码质量分析 