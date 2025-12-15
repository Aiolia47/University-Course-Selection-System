# 高校选课系统 (University Course Selection System)

一个基于 TypeScript 的全栈 Monorepo 项目，使用 Turborepo 进行管理。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 根据你的环境修改 `.env` 文件中的配置

### 开发模式

启动所有应用的开发服务器：

```bash
npm run dev
```

单独启动应用：

```bash
# 前端应用
npm run dev --filter=web

# 后端应用
npm run dev --filter=api
```

### 构建

构建所有应用：

```bash
npm run build
```

### 测试

运行所有测试：

```bash
npm run test
```

### 代码检查

```bash
# ESLint
npm run lint

# 格式化代码
npm run format

# 类型检查
npm run type-check
```

## 📁 项目结构

```
bmad7/
├── apps/                   # 应用程序
│   ├── web/               # React 前端应用
│   └── api/               # Express 后端应用
├── packages/              # 共享包
│   ├── shared/            # 共享类型和工具
│   ├── ui/                # 共享 UI 组件
│   └── config/            # 共享配置
├── docs/                  # 项目文档
│   ├── git/              # Git 相关文档
│   └── ...
├── .env.example          # 环境变量模板
├── package.json          # 根配置
├── turbo.json            # Turborepo 配置
└── tsconfig.json         # TypeScript 配置
```

## 🛠️ 技术栈

- **框架**: React 18.2+, Express.js 4.18+
- **语言**: TypeScript 5.0+
- **构建工具**: Vite 4.4+, Turborepo 1.10+
- **代码规范**: ESLint 8.55+, Prettier 3.1+
- **测试**: Jest, @testing-library/react
- **包管理**: npm workspaces
- **版本控制**: Git + Husky + lint-staged

## 📋 开发工作流

1. 从 `develop` 分支创建功能分支
2. 开发功能并编写测试
3. 提交代码（遵循 [Conventional Commits](https://conventionalcommits.org/) 规范）
4. 创建 Pull Request 到 `develop` 分支
5. 代码审查通过后合并
6. 部署到测试环境

详细流程请参考 [Git 分支策略](docs/git/branching-strategy.md)

## 🧪 测试策略

- **单元测试**: Jest + Testing Library
- **集成测试**: Supertest (API)
- **端到端测试**: Playwright (计划中)
- **测试覆盖率**: 目标 > 80%

## 📦 发布流程

1. 从 `develop` 创建 `release` 分支
2. 更新版本号和 CHANGELOG
3. 合并到 `main` 并打 tag
4. 自动部署到生产环境

## 🤝 贡献指南

1. Fork 项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 获取帮助

- 查看 [常见问题](docs/faq.md)
- 提交 [Issue](https://github.com/Aiolia47/University-Course-Selection-System/issues)
- 联系开发团队
