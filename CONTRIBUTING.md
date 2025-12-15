# 贡献指南

感谢你对 BMAD7 项目的关注！我们欢迎各种形式的贡献。

## 📋 开始之前

- 查看我们的[行为准则](CODE_OF_CONDUCT.md)
- 确保你理解项目的[架构文档](docs/architecture/)
- 熟悉我们的[Git 分支策略](docs/git/branching-strategy.md)

## 🚀 如何贡献

### 报告 Bug

如果你发现了 bug，请：

1. 检查 [Issues](https://github.com/your-org/bmad7/issues) 是否已经报告
2. 如果没有，创建一个新的 Issue
3. 使用我们的 bug 报告模板
4. 提供尽可能详细的信息：
   - 重现步骤
   - 期望的行为
   - 实际的行为
   - 环境信息（OS、Node.js 版本等）

### 提出功能请求

1. 检查 [Issues](https://github.com/your-org/bmad7/issues) 是否已有相关讨论
2. 创建新的 Feature Request
3. 详细描述：
   - 问题的背景
   - 为什么这个功能有用
   - 你的建议实现

### 提交代码

#### 1. 设置开发环境

```bash
# Fork 项目到你的 GitHub 账户
# 克隆你的 fork
git clone https://github.com/your-username/bmad7.git
cd bmad7

# 添加上游仓库
git remote add upstream https://github.com/your-org/bmad7.git

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件
```

#### 2. 创建功能分支

```bash
# 确保在最新的 develop 分支
git checkout develop
git pull upstream develop

# 创建功能分支
git checkout -b feature/your-feature-name
```

#### 3. 开发

- 遵循项目的编码标准
- 编写测试（单元测试/集成测试）
- 确保测试覆盖率不降低
- 运行代码检查和测试：

```bash
npm run lint
npm run type-check
npm run test
```

#### 4. 提交代码

遵循 [Conventional Commits](https://conventionalcommits.org/) 规范：

```bash
# 添加文件
git add .

# 提交（使用规范的提交信息）
git commit -m "feat: add user authentication functionality"

# 推送
git push origin feature/your-feature-name
```

提交类型：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 5. 创建 Pull Request

1. 访问 GitHub 上的项目页面
2. 点击 "New Pull Request"
3. 选择你的功能分支到 `develop` 分支
4. 填写 PR 模板：
   - 清晰的标题
   - 详细的描述
   - 相关的 Issue
   - 测试步骤
   - 截图（如果适用）

#### 6. 代码审查

- 所有 PR 需要至少一个审查者批准
- 解决所有审查意见
- 确保 CI 检查通过
- 保持讨论友好和专业

## 📝 编码标准

### TypeScript

- 使用 TypeScript 严格模式
- 为所有函数提供明确的返回类型（如果可以推断则可选）
- 优先使用 interface 而不是 type（除非必要）
- 使用 PascalCase 命名组件和类型
- 使用 camelCase 命名变量和函数

### React

- 使用函数组件和 Hooks
- 组件文件使用 `.tsx` 扩展名
- 导出默认组件作为命名导出
- 遵循 Hooks 规则
- 使用 TypeScript props 接口

### 命名规范

- **文件名**: kebab-case
- **组件名**: PascalCase
- **变量/函数**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **CSS 类名**: BEM 方法论

### 文件组织

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── hooks/         # 自定义 hooks
├── utils/         # 工具函数
├── types/         # 类型定义
├── services/      # API 服务
└── __tests__/     # 测试文件
```

## 🧪 测试指南

### 编写测试

- 新功能必须包含测试
- 测试覆盖率应保持在 80% 以上
- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange, Act, Assert）

### 测试类型

- **单元测试**: 测试单个函数或组件
- **集成测试**: 测试多个部分的交互
- **端到端测试**: 测试完整用户流程

### 运行测试

```bash
# 运行所有测试
npm run test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

## 📖 文档

- 更新相关文档（README、API 文档等）
- 为新功能添加使用示例
- 保持代码注释清晰简洁

## 🎉 发布

只有维护者可以发布版本。发布流程：

1. 从 `develop` 创建 `release` 分支
2. 更新版本号
3. 更新 CHANGELOG.md
4. 合并到 `main` 并打 tag
5. 自动部署

## 🆘 获取帮助

如果你有任何问题：

- 查看 [FAQ](docs/faq.md)
- 在 Issue 中提问
- 联系维护者

## 🏆 认可贡献者

我们感谢所有贡献者！查看 [CONTRIBUTORS.md](CONTRIBUTORS.md) 了解贡献列表。

再次感谢你的贡献！🎉