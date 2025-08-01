# Cursor Rules - Cursor 规则系统

本目录包含了项目的 Cursor IDE 规则，这些规则会自动被 Cursor 识别并执行。[[memory:4419742]]

## 规则文件列表

1. **[01-import-alias.md](./01-import-alias.md)** - 导入别名规则
   - 强制使用 `@/` 路径别名
   - 规范导入路径格式
   - 提供迁移指南

2. **[02-code-quality.md](./02-code-quality.md)** - 代码质量规则
   - TypeScript 严格模式
   - React 最佳实践
   - Redux Toolkit 使用规范
   - 错误处理和性能优化

3. **[03-project-specific.md](./03-project-specific.md)** - 项目特定规则
   - 游戏状态管理
   - 游戏循环和性能
   - UI/UX 规范
   - 数据持久化

4. **[04-code-formatting.md](./04-code-formatting.md)** - 代码格式化规则
   - Prettier 配置说明
   - 自动格式化设置
   - 导入语句排序
   - 格式化最佳实践

## 使用方式

这些规则会被 Cursor IDE 自动加载和执行。当你：

- 编写新代码时，Cursor 会根据这些规则提供智能提示
- 重构代码时，Cursor 会自动应用这些规则
- 使用 AI 助手时，它会遵循这些规则生成代码 [[memory:4107741]]

## 配置说明

### TypeScript 配置

- `tsconfig.app.json` 已配置 `@/*` 路径映射到 `src/*`
- 启用了 TypeScript 严格模式

### Vite 配置

- `vite.config.ts` 已配置 resolve.alias
- `@` 映射到 `./src` 目录

### Prettier 配置

- `.prettierrc.json` 定义了代码格式规则
- 配置了自动导入排序
- 与 ESLint 完全集成

### IDE 支持

- Cursor/VSCode 会自动识别路径别名
- 提供智能代码补全和导入建议
- 保存时自动格式化代码

## 规则优先级

1. **高优先级**
   - 导入别名规则（影响所有代码）
   - TypeScript 类型安全
   - 游戏核心逻辑正确性
   - 代码格式一致性

2. **中优先级**
   - 代码风格一致性
   - React 最佳实践
   - 性能优化建议

3. **低优先级**
   - 注释规范
   - 文件命名建议

## 更新和维护

- 规则文件可以随项目发展进行更新
- 新增规则时，请遵循现有的编号和格式规范
- 重要的规则变更应该在团队中讨论

## 快速检查清单

在提交代码前，请确保：

- [ ] 所有导入使用 `@/` 别名
- [ ] 没有 TypeScript 类型错误
- [ ] 遵循 React Hooks 规则
- [ ] 使用服务层处理业务逻辑
- [ ] 性能敏感的组件使用了优化
- [ ] 代码有适当的错误处理
- [ ] 代码已通过 Prettier 格式化（运行 `npm run format`）
- [ ] 代码已通过 ESLint 检查（运行 `npm run lint`）
