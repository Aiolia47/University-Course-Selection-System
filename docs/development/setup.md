# 开发环境设置指南

## 📋 前置要求

### 必需软件

1. **Node.js** (>= 18.0.0)
   ```bash
   # 使用 nvm (推荐)
   nvm install 18
   nvm use 18

   # 或从官网下载
   # https://nodejs.org/
   ```

2. **npm** (>= 9.0.0)
   ```bash
   npm install -g npm@latest
   ```

3. **Git**
   ```bash
   # Windows: 从 https://git-scm.com/download/win 下载
   # macOS: brew install git
   # Linux: sudo apt-get install git
   ```

### 推荐工具

1. **VS Code** + 以下扩展：
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier
   - Auto Rename Tag
   - Bracket Pair Colorizer
   - GitLens

2. **Postman** 或 **Insomnia** (API 测试)

3. **Docker** 和 **Docker Compose** (可选，用于容器化开发)

## 🚀 项目设置

### 1. 克隆项目

```bash
git clone https://github.com/your-org/bmad7.git
cd bmad7
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板并根据需要修改：

```bash
cp .env.example .env
```

关键配置项：

```env
# 应用环境
NODE_ENV=development

# 前端
REACT_APP_API_URL=http://localhost:3001

# 后端
API_PORT=3001

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bmad7
DB_USER=your_username
DB_PASSWORD=your_password

# JWT 密钥 (生成一个强密码)
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. 数据库设置

如果使用 PostgreSQL：

```bash
# 创建数据库
createdb bmad7

# 创建测试数据库
createdb bmad7_test
```

### 5. 启动开发服务器

```bash
# 启动所有服务
npm run dev

# 或分别启动
npm run dev --filter=web  # 前端
npm run dev --filter=api  # 后端
```

访问应用：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- API 文档: http://localhost:3001/api-docs

## 🔧 开发工具配置

### VS Code 设置

在项目根目录创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/Thumbs.db": true
  }
}
```

创建 `.vscode/launch.json` 用于调试：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/index.ts",
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Git Hooks 设置

项目已配置 Husky 和 lint-staged。安装 hooks：

```bash
npm install
npx husky install
```

这会在提交时自动运行：
- ESLint 修复
- Prettier 格式化
- 类型检查

## 📁 项目结构理解

```
bmad7/
├── apps/
│   ├── web/              # React 前端
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/              # Express 后端
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── models/
│       │   ├── services/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── shared/           # 共享类型和工具
│   │   └── src/
│   │       ├── types/
│   │       ├── utils/
│   │       └── index.ts
│   │
│   ├── ui/              # 共享 UI 组件
│   │   └── src/
│   │       ├── components/
│   │       └── index.ts
│   │
│   └── config/          # 共享配置
│       └── eslint-config.js
│
├── docs/                # 项目文档
└── infrastructure/      # Docker 等
```

## 🧪 测试

### 运行测试

```bash
# 所有测试
npm run test

# 特定应用
npm run test --filter=web
npm run test --filter=api

# 监视模式
npm run test:watch

# 覆盖率
npm run test:coverage
```

### 编写测试

测试文件应放在：
- 前端：`apps/web/src/**/__tests__/` 或 `*.test.tsx`
- 后端：`apps/api/src/**/__tests__/` 或 `*.test.ts`

示例：

```typescript
// apps/web/src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

## 🔄 常用命令

```bash
# 开发
npm run dev              # 启动所有开发服务器
npm run dev:web          # 仅前端
npm run dev:api          # 仅后端

# 构建
npm run build            # 构建所有
npm run build:web        # 仅前端
npm run build:api        # 仅后端

# 代码质量
npm run lint             # ESLint 检查
npm run format           # Prettier 格式化
npm run type-check       # TypeScript 类型检查

# 测试
npm run test             # 运行所有测试
npm run test:watch       # 监视模式
npm run test:coverage    # 生成覆盖率报告

# 清理
npm run clean            # 清理所有构建产物
```

## 🐛 常见问题

### 问题：端口已被占用

```bash
# 查找占用端口的进程
lsof -i :3000
# 或 Windows
netstat -ano | findstr :3000

# 终止进程
kill -9 PID
# 或 Windows
taskkill /PID PID /F
```

### 问题：依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 问题：TypeScript 错误

```bash
# 重新构建
npm run clean
npm run build

# 检查类型
npm run type-check
```

### 问题：Git 权限错误

```bash
# 配置 Git 用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 📚 学习资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React 官方文档](https://react.dev/)
- [Express.js 指南](https://expressjs.com/en/guide/)
- [Turborepo 文档](https://turbo.build/repo/docs)
- [Jest 测试框架](https://jestjs.io/docs/getting-started)

## 💡 开发技巧

1. **使用热重载**：修改代码后自动刷新
2. **利用 TypeScript**：获得智能提示和类型安全
3. **编写测试**：确保代码质量
4. **使用 Git 分支**：保持主分支干净
5. **定期拉取更新**：保持与上游同步

## 🆘 获取帮助

- 查看项目 FAQ
- 在 GitHub Issues 提问
- 联系维护团队
- 加入开发者社区（Discord/Slack）