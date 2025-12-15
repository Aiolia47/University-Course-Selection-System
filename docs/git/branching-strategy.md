# Git 分支策略

## 分支类型

### 1. 主分支 (Main Branches)

- `main`: 主分支，始终保持稳定可部署状态
- `develop`: 开发分支，集成最新的功能开发

### 2. 支持分支 (Supporting Branches)

- `feature/*`: 功能分支，从 `develop` 分出，开发新功能
- `release/*`: 发布分支，从 `develop` 分出，准备发布版本
- `hotfix/*`: 热修复分支，从 `main` 分出，紧急修复生产问题

## 工作流程

### 功能开发 (Feature Flow)

1. 从 `develop` 创建功能分支
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/user-authentication
   ```

2. 开发功能并提交
   ```bash
   git add .
   git commit -m "feat: add user authentication functionality"
   ```

3. 推送功能分支
   ```bash
   git push origin feature/user-authentication
   ```

4. 创建 Pull Request 到 `develop` 分支

5. 代码审查通过后合并
   ```bash
   git checkout develop
   git merge feature/user-authentication
   git push origin develop
   ```

6. 删除功能分支
   ```bash
   git branch -d feature/user-authentication
   git push origin --delete feature/user-authentication
   ```

### 发布流程 (Release Flow)

1. 从 `develop` 创建发布分支
   ```bash
   git checkout develop
   git checkout -b release/v1.1.0
   ```

2. 完成发布准备（版本号更新、文档等）

3. 合并到 `main` 和 `develop`
   ```bash
   git checkout main
   git merge release/v1.1.0
   git tag v1.1.0

   git checkout develop
   git merge release/v1.1.0

   git push origin main --tags
   git push origin develop
   ```

4. 删除发布分支
   ```bash
   git branch -d release/v1.1.0
   git push origin --delete release/v1.1.0
   ```

### 热修复流程 (Hotfix Flow)

1. 从 `main` 创建热修复分支
   ```bash
   git checkout main
   git checkout -b hotfix/critical-bug-fix
   ```

2. 修复问题并测试

3. 合并到 `main` 和 `develop`
   ```bash
   git checkout main
   git merge hotfix/critical-bug-fix
   git tag v1.0.1

   git checkout develop
   git merge hotfix/critical-bug-fix

   git push origin main --tags
   git push origin develop
   ```

4. 删除热修复分支
   ```bash
   git branch -d hotfix/critical-bug-fix
   git push origin --delete hotfix/critical-bug-fix
   ```

## 提交信息规范

使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(auth): add user login functionality

- Implement JWT authentication
- Add login form component
- Update user service
```

## 分支命名规范

- 功能分支：`feature/<功能名称>`
- 发布分支：`release/v<版本号>`
- 热修复分支：`hotfix/<问题描述>`
- 个人分支：`wip/<开发者>/<功能名称>`

## 保护规则

### Main 分支
- 禁止直接推送
- 需要 Pull Request 和代码审查
- 必须通过所有 CI 检查
- 需要管理员批准

### Develop 分支
- 禁止直接推送
- 需要 Pull Request 和代码审查
- 必须通过所有 CI 检查

## 代码审查要求

1. 至少需要一人审查
2. 所有新功能需要测试
3. 代码覆盖率不能降低
4. 必须通过 linting 和类型检查
5. 构建必须成功