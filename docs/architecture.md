# 大学生在线选课系统全栈架构文档

## 介绍

本文档概述了大学生在线选课系统的完整全栈架构，包括后端系统、前端实现及其集成。它作为AI驱动开发的单一真实来源，确保整个技术栈的一致性。

这种统一方法结合了传统上分离的后端和前端架构文档，简化了现代全栈应用程序的开发流程，因为这些关注点日益交织在一起。

### 启动模板或现有项目

N/A - 绿地项目

### 变更日志

| 日期 | 版本 | 描述 | 作者 |
|------|------|------|------|
| 2025-12-15 | v1.0 | 初始全栈架构版本 | Winston (Architect) |

## 高级架构

### 技术摘要

本系统采用前后端分离的Monorepo架构，使用React + TypeScript前端和Node.js + Express后端，配合MySQL数据库和Redis缓存。整体架构采用分层设计，支持水平扩展和微服务演进。系统基于JWT的身份认证，RESTful API设计，并通过Nginx反向代理和CDN优化性能。架构设计优先考虑用户体验，从用户旅程出发反向推导技术实现，确保系统在选课高峰期能够处理高并发访问。

### 平台和基础设施选择

**平台:** 自托管云基础设施（支持阿里云/腾讯云/AWS）
**关键服务:**
- 前端: Vercel/Netlify 静态托管
- 后端: Docker容器化部署
- 数据库: MySQL 8.0 RDS + Redis 集群
- 文件存储: 对象存储服务
- 监控: 云监控服务 + 日志服务

**部署主机和区域:** 主要部署在华东区域，支持多可用区高可用

### 仓库结构

**结构:** Monorepo（单仓库）
**Monorepo工具:** Turborepo + npm workspaces
**包组织策略:**
- apps/: 应用程序包（前端和后端）
- packages/: 共享包（类型定义、UI组件、工具函数）
- docs/: 文档
- infrastructure/: 基础设施代码

### 高级架构图

```mermaid
graph TB
    subgraph "用户层"
        U1[学生用户]
        U2[管理员用户]
    end

    subgraph "CDN/边缘层"
        CDN[CDN/静态资源]
    end

    subgraph "前端层"
        FE[React前端应用]
    end

    subgraph "网关层"
        NGINX[Nginx反向代理]
        LB[负载均衡器]
    end

    subgraph "后端层"
        API[Express API服务器]
        AUTH[认证服务]
        COURSE[课程服务]
        USER[用户服务]
        SELECT[选课服务]
    end

    subgraph "缓存层"
        REDIS[Redis缓存]
    end

    subgraph "数据层"
        MYSQL[(MySQL数据库)]
        FILES[(文件存储)]
    end

    subgraph "监控层"
        LOG[日志收集]
        MONITOR[性能监控]
    end

    U1 --> CDN
    U2 --> CDN
    CDN --> FE
    FE --> NGINX
    NGINX --> LB
    LB --> API
    API --> AUTH
    API --> COURSE
    API --> USER
    API --> SELECT
    AUTH --> REDIS
    COURSE --> REDIS
    USER --> REDIS
    SELECT --> REDIS
    AUTH --> MYSQL
    COURSE --> MYSQL
    USER --> MYSQL
    SELECT --> MYSQL
    FILES --> FILES
    API --> LOG
    API --> MONITOR
```

### 架构模式

- **前后端分离架构:** React SPA + Express RESTful API - _理由:_ 独立开发部署，提升开发效率和系统可维护性
- **组件化UI:** 可复用React组件与TypeScript - _理由:_ 提升代码复用性，确保大型代码库的可维护性和类型安全
- **仓库模式:** 抽象数据访问逻辑 - _理由:_ 支持测试和未来数据库迁移的灵活性
- **API网关模式:** 所有API调用的单一入口点 - _理由:_ 集中化的认证、速率限制和监控
- **CQRS模式:** 读写分离的数据处理 - _理由:_ 优化高并发选课场景下的性能和一致性
- **事件驱动架构:** 基于事件的系统组件通信 - _理由:_ 提高系统解耦和扩展性
- **缓存优先策略:** Redis多层缓存 - _理由:_ 显著提升选课高峰期的响应速度

## 技术栈

### 技术栈表

| 类别 | 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|------|----------|
| 前端语言 | TypeScript | 5.0+ | 类型安全的JavaScript开发 | 提供编译时类型检查，提升代码质量和开发体验 |
| 前端框架 | React | 18.2+ | 用户界面构建 | 成熟的生态系统，强大的社区支持，性能优秀 |
| UI组件库 | Ant Design | 5.0+ | UI组件库 | 企业级UI设计，丰富的组件，良好的中文支持 |
| 状态管理 | Redux Toolkit + RTK Query | 1.9+ | 应用状态管理 | 标准化的状态管理，内置缓存和异步处理 |
| 后端语言 | TypeScript | 5.0+ | 类型安全的服务端开发 | 与前端统一技术栈，类型安全，开发效率高 |
| 后端框架 | Express.js | 4.18+ | Web应用框架 | 成熟稳定，中间件丰富，学习成本低 |
| API风格 | RESTful API | - | API设计风格 | 标准化、易于理解、缓存友好 |
| 数据库 | MySQL | 8.0+ | 主数据库 | 成熟可靠，事务支持完善，性能优秀 |
| 缓存 | Redis | 7.0+ | 缓存和会话存储 | 高性能内存数据库，丰富的数据结构 |
| 文件存储 | MinIO/S3 | - | 文件存储 | 兼容S3 API，支持云存储和自部署 |
| 身份认证 | JWT + Refresh Token | - | 用户认证 | 无状态认证，支持分布式部署 |
| 前端测试 | Jest + Testing Library | 29+ | 前端单元测试 | 完整的测试工具链，良好的React支持 |
| 后端测试 | Jest + Supertest | 29+ | 后端API测试 | 统一的测试框架，API测试简单高效 |
| E2E测试 | Playwright | 1.35+ | 端到端测试 | 跨浏览器支持，优秀的调试体验 |
| 构建工具 | Turborepo | 1.10+ | Monorepo构建 | 高效的增量构建，优秀的缓存机制 |
| 打包工具 | Vite | 4.4+ | 前端打包 | 快速的热重载，优秀的开发体验 |
| IaC工具 | Docker Compose | 2.0+ | 基础设施代码 | 容器化部署，环境一致性 |
| CI/CD | GitHub Actions | - | 持续集成部署 | 与代码仓库深度集成，免费额度充足 |
| 监控 | Prometheus + Grafana | - | 应用监控 | 开源监控方案，丰富的可视化能力 |
| 日志 | Winston + ELK Stack | - | 日志管理 | 结构化日志，强大的搜索和分析能力 |
| CSS框架 | CSS Modules + PostCSS | - | CSS处理 | 模块化CSS，避免样式冲突 |

## 数据模型

### User用户模型

**用途:** 表示系统用户（学生和管理员）的基本信息和身份认证

**关键属性:**
- id: string - 用户唯一标识符
- studentId: string - 学号（学生用户）
- username: string - 用户名
- email: string - 邮箱地址
- passwordHash: string - 密码哈希
- role: UserRole - 用户角色（学生/管理员）
- status: UserStatus - 用户状态
- profile: UserProfile - 用户详细信息
- createdAt: Date - 创建时间
- updatedAt: Date - 更新时间

#### TypeScript接口

```typescript
interface User {
  id: string;
  studentId?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  major?: string;
  grade?: string;
  class?: string;
}

enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}
```

#### 关系关系

- 一对多关系: User -> Selection (一个用户可以选择多门课程)
- 一对多关系: User -> AuditLog (用户的操作审计日志)

### Course课程模型

**用途:** 表示课程的基本信息、教学安排和选课限制

**关键属性:**
- id: string - 课程唯一标识符
- code: string - 课程代码
- name: string - 课程名称
- description: string - 课程描述
- credits: number - 学分数
- teacher: string - 授课教师
- capacity: number - 课程容量
- enrolled: number - 已选课人数
- schedule: CourseSchedule - 上课安排
- prerequisites: string[] - 先修课程要求
- status: CourseStatus - 课程状态
- createdAt: Date - 创建时间
- updatedAt: Date - 更新时间

#### TypeScript接口

```typescript
interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  teacher: string;
  capacity: number;
  enrolled: number;
  schedule: CourseSchedule;
  prerequisites: string[];
  status: CourseStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseSchedule {
  dayOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  location: string;
  weeks: number[];
}

enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7
}

enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}
```

#### 关系关系

- 一对多关系: Course -> Selection (一门课程可以被多个学生选择)
- 多对多关系: Course -> Course (通过先修课程关系)

### Selection选课记录模型

**用途:** 记录学生的选课状态和选课历史

**关键属性:**
- id: string - 选课记录唯一标识符
- userId: string - 学生ID
- courseId: string - 课程ID
- status: SelectionStatus - 选课状态
- selectedAt: Date - 选课时间
- confirmedAt?: Date - 确认时间
- cancelledAt?: Date - 取消时间
- notes?: string - 备注信息

#### TypeScript接口

```typescript
interface Selection {
  id: string;
  userId: string;
  courseId: string;
  status: SelectionStatus;
  selectedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
}

enum SelectionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}
```

#### 关系关系

- 多对一关系: Selection -> User (选课记录属于某个用户)
- 多对一关系: Selection -> Course (选课记录对应某门课程)

### Permission权限模型

**用途:** 定义系统权限和角色权限关系

**关键属性:**
- id: string - 权限唯一标识符
- name: string - 权限名称
- description: string - 权限描述
- resource: string - 资源类型
- action: string - 操作类型
- conditions?: PermissionCondition[] - 权限条件

#### TypeScript接口

```typescript
interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}
```

#### 关系关系

- 多对多关系: Role -> Permission (角色拥有多个权限)
- 一对多关系: Permission -> RolePermission

### AuditLog审计日志模型

**用途:** 记录系统操作审计日志，支持安全审计和问题追踪

**关键属性:**
- id: string - 日志记录唯一标识符
- userId: string - 操作用户ID
- action: string - 操作类型
- resource: string - 操作资源
- resourceId?: string - 资源ID
- details: Record<string, any> - 操作详情
- ipAddress: string - IP地址
- userAgent: string - 用户代理
- timestamp: Date - 操作时间

#### TypeScript接口

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

#### 关系关系

- 多对一关系: AuditLog -> User (日志记录属于某个用户)

## API规范

### REST API规范

```yaml
openapi: 3.0.0
info:
  title: 大学生在线选课系统 API
  version: 1.0.0
  description: 提供学生选课、课程管理、用户管理等功能的RESTful API
servers:
  - url: https://api.course-system.example.com/v1
    description: 生产环境
  - url: https://staging-api.course-system.example.com/v1
    description: 测试环境
  - url: http://localhost:3001/v1
    description: 开发环境

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  # 认证相关API
  /auth/login:
    post:
      summary: 用户登录
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, password]
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: 登录成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  accessToken:
                    type: string
                  refreshToken:
                    type: string

  /auth/refresh:
    post:
      summary: 刷新访问令牌
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken:
                  type: string

  /auth/logout:
    post:
      summary: 用户登出
      tags: [Authentication]
      security:
        - bearerAuth: []

  # 用户管理API
  /users:
    get:
      summary: 获取用户列表（管理员）
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: role
          in: query
          schema:
            type: string
            enum: [student, admin]
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive, suspended]
      responses:
        '200':
          description: 用户列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: 创建用户（管理员）
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'

  /users/{userId}:
    get:
      summary: 获取用户详情
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 用户详情
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

    put:
      summary: 更新用户信息
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserRequest'

    delete:
      summary: 删除用户（管理员）
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string

  /users/profile:
    get:
      summary: 获取当前用户信息
      tags: [Users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 当前用户信息
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

    put:
      summary: 更新当前用户信息
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProfileRequest'

  # 课程管理API
  /courses:
    get:
      summary: 获取课程列表
      tags: [Courses]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
        - name: teacher
          in: query
          schema:
            type: string
        - name: credits
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, published, cancelled, completed]
      responses:
        '200':
          description: 课程列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  courses:
                    type: array
                    items:
                      $ref: '#/components/schemas/Course'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: 创建课程（管理员）
      tags: [Courses]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCourseRequest'

  /courses/{courseId}:
    get:
      summary: 获取课程详情
      tags: [Courses]
      security:
        - bearerAuth: []
      parameters:
        - name: courseId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 课程详情
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Course'

    put:
      summary: 更新课程信息（管理员）
      tags: [Courses]
      security:
        - bearerAuth: []
      parameters:
        - name: courseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCourseRequest'

    delete:
      summary: 删除课程（管理员）
      tags: [Courses]
      security:
        - bearerAuth: []
      parameters:
        - name: courseId
          in: path
          required: true
          schema:
            type: string

  # 选课管理API
  /selections:
    get:
      summary: 获取学生选课列表
      tags: [Selections]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: query
          description: 管理员查询指定用户的选课记录
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, confirmed, cancelled, completed]
        - name: semester
          in: query
          schema:
            type: string
      responses:
        '200':
          description: 选课列表
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Selection'

    post:
      summary: 选择课程
      tags: [Selections]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [courseId]
              properties:
                courseId:
                  type: string

  /selections/{selectionId}:
    delete:
      summary: 取消选课
      tags: [Selections]
      security:
        - bearerAuth: []
      parameters:
        - name: selectionId
          in: path
          required: true
          schema:
            type: string

  /selections/check-conflicts:
    post:
      summary: 检查选课冲突
      tags: [Selections]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [courseIds]
              properties:
                courseIds:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: 冲突检测结果
          content:
            application/json:
              schema:
                type: object
                properties:
                  hasConflicts:
                    type: boolean
                  conflicts:
                    type: array
                    items:
                      $ref: '#/components/schemas/SelectionConflict'

  # 数据统计API
  /statistics/overview:
    get:
      summary: 获取系统概览统计（管理员）
      tags: [Statistics]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 系统统计概览
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SystemStatistics'

  /statistics/courses:
    get:
      summary: 获取课程统计数据（管理员）
      tags: [Statistics]
      security:
        - bearerAuth: []
      parameters:
        - name: semester
          in: query
          schema:
            type: string
        - name: department
          in: query
          schema:
            type: string

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        studentId:
          type: string
        username:
          type: string
        email:
          type: string
        role:
          type: string
          enum: [student, admin]
        status:
          type: string
          enum: [active, inactive, suspended]
        profile:
          $ref: '#/components/schemas/UserProfile'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    UserProfile:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
        avatar:
          type: string
        phone:
          type: string
        major:
          type: string
        grade:
          type: string
        class:
          type: string

    Course:
      type: object
      properties:
        id:
          type: string
        code:
          type: string
        name:
          type: string
        description:
          type: string
        credits:
          type: integer
        teacher:
          type: string
        capacity:
          type: integer
        enrolled:
          type: integer
        schedule:
          $ref: '#/components/schemas/CourseSchedule'
        prerequisites:
          type: array
          items:
            type: string
        status:
          type: string
          enum: [draft, published, cancelled, completed]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CourseSchedule:
      type: object
      properties:
        dayOfWeek:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 7
        startTime:
          type: string
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
        endTime:
          type: string
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
        location:
          type: string
        weeks:
          type: array
          items:
            type: integer

    Selection:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        courseId:
          type: string
        status:
          type: string
          enum: [pending, confirmed, cancelled, completed]
        selectedAt:
          type: string
          format: date-time
        confirmedAt:
          type: string
          format: date-time
        cancelledAt:
          type: string
          format: date-time
        notes:
          type: string
        course:
          $ref: '#/components/schemas/Course'

    SelectionConflict:
      type: object
      properties:
        type:
          type: string
          enum: [time_conflict, prerequisite_missing, capacity_full, duplicate]
        message:
          type: string
        conflictingCourses:
          type: array
          items:
            type: string

    CreateUserRequest:
      type: object
      required: [username, email, password, role]
      properties:
        username:
          type: string
        email:
          type: string
        password:
          type: string
        role:
          type: string
          enum: [student, admin]
        profile:
          $ref: '#/components/schemas/UserProfile'

    UpdateUserRequest:
      type: object
      properties:
        email:
          type: string
        status:
          type: string
          enum: [active, inactive, suspended]
        profile:
          $ref: '#/components/schemas/UserProfile'

    UpdateProfileRequest:
      type: object
      properties:
        profile:
          $ref: '#/components/schemas/UserProfile'

    CreateCourseRequest:
      type: object
      required: [code, name, credits, teacher, capacity]
      properties:
        code:
          type: string
        name:
          type: string
        description:
          type: string
        credits:
          type: integer
          minimum: 1
          maximum: 10
        teacher:
          type: string
        capacity:
          type: integer
          minimum: 1
        schedule:
          $ref: '#/components/schemas/CourseSchedule'
        prerequisites:
          type: array
          items:
            type: string

    UpdateCourseRequest:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        credits:
          type: integer
          minimum: 1
          maximum: 10
        teacher:
          type: string
        capacity:
          type: integer
          minimum: 1
        schedule:
          $ref: '#/components/schemas/CourseSchedule'
        prerequisites:
          type: array
          items:
            type: string
        status:
          type: string
          enum: [draft, published, cancelled, completed]

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

    SystemStatistics:
      type: object
      properties:
        totalUsers:
          type: integer
        totalCourses:
          type: integer
        totalSelections:
          type: integer
        activeUsers:
          type: integer
        publishedCourses:
          type: integer
        confirmedSelections:
          type: integer

  responses:
    UnauthorizedError:
      description: 未授权访问
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string

    ForbiddenError:
      description: 权限不足
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string

    NotFoundError:
      description: 资源未找到
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string

    ValidationError:
      description: 数据验证失败
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                  message:
                    type: string
                  details:
                    type: object
```

## 组件

### 认证组件

**职责:** 处理用户身份认证和授权，包括登录、注册、令牌管理和权限验证

**关键接口:**
- 用户登录/登出
- JWT令牌生成和验证
- 权限检查中间件
- 密码加密和验证

**依赖:** Redis缓存、用户数据库

**技术栈:** Node.js + Express + JWT + Bcrypt + Redis

### 用户管理组件

**职责:** 管理用户基本信息、用户资料和用户状态

**关键接口:**
- 用户CRUD操作
- 用户信息查询和更新
- 用户状态管理
- 密码重置

**依赖:** 认证组件、数据库

**技术栈:** Express + TypeORM + MySQL + 验证中间件

### 课程管理组件

**职责:** 管理课程信息、课程状态和课程数据

**关键接口:**
- 课程CRUD操作
- 课程查询和筛选
- 课程状态管理
- 课程数据导入导出

**依赖:** 用户管理组件、数据库

**技术栈:** Express + TypeORM + MySQL + Excel处理库

### 选课服务组件

**职责:** 处理学生选课业务逻辑、选课冲突检测和选课状态管理

**关键接口:**
- 选课/退课操作
- 选课冲突检测
- 选课名额管理
- 选课历史记录

**依赖:** 认证组件、课程管理组件、用户管理组件

**技术栈:** Express + TypeORM + Redis + 事务管理

### 数据统计组件

**职责:** 提供系统数据统计、报表生成和数据分析功能

**关键接口:**
- 系统概览统计
- 课程选课统计
- 用户行为分析
- 报表导出

**依赖:** 选课服务组件、课程管理组件

**技术栈:** Express + 数据聚合库 + 图表生成库

### 前端API客户端组件

**职责:** 处理前端与后端API通信，包括请求拦截、响应处理和错误处理

**关键接口:**
- HTTP请求封装
- 认证令牌管理
- 请求/响应拦截器
- 错误处理和重试

**依赖:** 认证组件

**技术栈:** Axios + TypeScript + React Context

### 状态管理组件

**职责:** 管理前端应用状态，包括用户状态、课程数据和UI状态

**关键接口:**
- 全局状态管理
- 状态持久化
- 状态订阅和更新
- 中间件支持

**依赖:** API客户端组件

**技术栈:** Redux Toolkit + RTK Query + TypeScript

### 组件图

```mermaid
graph TB
    subgraph "前端层"
        UI[React UI组件]
        STATE[状态管理Redux]
        API_CLIENT[API客户端]
        AUTH_CLIENT[认证客户端]
    end

    subgraph "API网关层"
        GATEWAY[Express网关]
        AUTH_MIDDLE[认证中间件]
        ERROR_MIDDLE[错误处理中间件]
    end

    subgraph "业务服务层"
        AUTH_SVC[认证服务]
        USER_SVC[用户服务]
        COURSE_SVC[课程服务]
        SELECT_SVC[选课服务]
        STATS_SVC[统计服务]
    end

    subgraph "数据访问层"
        USER_REPO[用户仓储]
        COURSE_REPO[课程仓储]
        SELECT_REPO[选课仓储]
        AUDIT_REPO[审计仓储]
    end

    subgraph "数据层"
        MYSQL[(MySQL数据库)]
        REDIS[(Redis缓存)]
    end

    UI --> STATE
    STATE --> API_CLIENT
    API_CLIENT --> AUTH_CLIENT
    AUTH_CLIENT --> GATEWAY
    GATEWAY --> AUTH_MIDDLE
    AUTH_MIDDLE --> AUTH_SVC
    AUTH_MIDDLE --> USER_SVC
    AUTH_MIDDLE --> COURSE_SVC
    AUTH_MIDDLE --> SELECT_SVC
    AUTH_MIDDLE --> STATS_SVC
    GATEWAY --> ERROR_MIDDLE

    AUTH_SVC --> USER_REPO
    USER_SVC --> USER_REPO
    COURSE_SVC --> COURSE_REPO
    SELECT_SVC --> SELECT_REPO
    STATS_SVC --> SELECT_REPO
    AUTH_SVC --> AUDIT_REPO

    USER_REPO --> MYSQL
    COURSE_REPO --> MYSQL
    SELECT_REPO --> MYSQL
    AUDIT_REPO --> MYSQL

    AUTH_SVC --> REDIS
    SELECT_SVC --> REDIS
    USER_SVC --> REDIS
```

## 外部API

本项目不依赖外部API服务，所有功能均为自研实现。

## 核心工作流

### 学生选课工作流

```mermaid
sequenceDiagram
    participant Student as 学生用户
    participant Frontend as 前端应用
    participant Gateway as API网关
    participant Auth as 认证服务
    participant Select as 选课服务
    participant Course as 课程服务
    participant Redis as Redis缓存
    participant DB as MySQL数据库

    Student->>Frontend: 浏览课程列表
    Frontend->>Gateway: GET /courses
    Gateway->>Auth: 验证JWT令牌
    Auth-->>Gateway: 验证通过
    Gateway->>Course: 查询课程信息
    Course->>Redis: 检查缓存
    alt 缓存命中
        Redis-->>Course: 返回缓存数据
    else 缓存未命中
        Course->>DB: 查询数据库
        DB-->>Course: 返回课程数据
        Course->>Redis: 更新缓存
    end
    Course-->>Gateway: 返回课程列表
    Gateway-->>Frontend: 返回响应
    Frontend-->>Student: 显示课程列表

    Student->>Frontend: 选择课程
    Frontend->>Gateway: POST /selections
    Gateway->>Auth: 验证JWT令牌
    Auth-->>Gateway: 验证通过
    Gateway->>Select: 处理选课请求

    Select->>Course: 检查课程状态
    Course-->>Select: 返回课程信息
    Select->>Select: 检查选课条件

    alt 选课冲突
        Select-->>Gateway: 返回冲突错误
        Gateway-->>Frontend: 错误响应
        Frontend-->>Student: 显示冲突信息
    else 选课成功
        Select->>DB: 创建选课记录
        Select->>Course: 更新选课人数
        Course->>Redis: 更新缓存
        Select->>Redis: 记录选课状态
        Select-->>Gateway: 返回成功
        Gateway-->>Frontend: 成功响应
        Frontend-->>Student: 显示选课成功
    end
```

### 管理员课程管理工作流

```mermaid
sequenceDiagram
    participant Admin as 管理员
    participant Frontend as 前端应用
    participant Gateway as API网关
    participant Auth as 认证服务
    participant Course as 课程服务
    participant DB as MySQL数据库
    participant Cache as Redis缓存
    participant Audit as 审计日志

    Admin->>Frontend: 登录管理后台
    Frontend->>Gateway: POST /auth/login
    Gateway->>Auth: 处理登录
    Auth->>DB: 验证用户信息
    DB-->>Auth: 返回用户数据
    Auth-->>Gateway: 返回JWT令牌
    Gateway-->>Frontend: 返回认证信息

    Admin->>Frontend: 创建新课程
    Frontend->>Gateway: POST /courses
    Gateway->>Auth: 验证管理员权限
    Auth-->>Gateway: 权限验证通过
    Gateway->>Course: 创建课程请求

    Course->>DB: 检查课程代码唯一性
    DB-->>Course: 返回检查结果

    alt 课程代码已存在
        Course-->>Gateway: 返回重复错误
        Gateway-->>Frontend: 错误响应
        Frontend-->>Admin: 显示错误信息
    else 课程代码可用
        Course->>DB: 保存课程信息
        Course->>Cache: 更新课程缓存
        Course->>Audit: 记录操作日志
        Course-->>Gateway: 返回成功
        Gateway-->>Frontend: 成功响应
        Frontend-->>Admin: 显示创建成功
    end
```

## 数据库架构

### 用户表 (users)

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

### 用户资料表 (user_profiles)

```sql
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    phone VARCHAR(20),
    major VARCHAR(100),
    grade VARCHAR(20),
    class VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_id (user_id)
);
```

### 课程表 (courses)

```sql
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    credits TINYINT UNSIGNED NOT NULL CHECK (credits >= 1 AND credits <= 10),
    teacher VARCHAR(100) NOT NULL,
    capacity SMALLINT UNSIGNED NOT NULL CHECK (capacity >= 1),
    enrolled SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('draft', 'published', 'cancelled', 'completed') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_teacher (teacher),
    INDEX idx_status (status),
    INDEX idx_credits (credits)
);
```

### 课程安排表 (course_schedules)

```sql
CREATE TABLE course_schedules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    weeks JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_day_time (day_of_week, start_time)
);
```

### 课程先修要求表 (course_prerequisites)

```sql
CREATE TABLE course_prerequisites (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_id VARCHAR(36) NOT NULL,
    prerequisite_course_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY uk_course_prerequisite (course_id, prerequisite_course_id),
    INDEX idx_course_id (course_id),
    INDEX idx_prerequisite_id (prerequisite_course_id)
);
```

### 选课记录表 (selections)

```sql
CREATE TABLE selections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_course (user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status),
    INDEX idx_selected_at (selected_at)
);
```

### 权限表 (permissions)

```sql
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_resource_action (resource, action)
);
```

### 角色权限关联表 (role_permissions)

```sql
CREATE TABLE role_permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    role ENUM('student', 'admin') NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(36) NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role, permission_id),
    INDEX idx_role (role),
    INDEX idx_permission_id (permission_id)
);
```

### 审计日志表 (audit_logs)

```sql
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource),
    INDEX idx_timestamp (timestamp),
    INDEX idx_resource_id (resource_id)
);
```

### 视图定义

#### 课程详情视图

```sql
CREATE VIEW course_details AS
SELECT
    c.id,
    c.code,
    c.name,
    c.description,
    c.credits,
    c.teacher,
    c.capacity,
    c.enrolled,
    c.status,
    c.created_at,
    c.updated_at,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'dayOfWeek', cs.day_of_week,
            'startTime', cs.start_time,
            'endTime', cs.end_time,
            'location', cs.location,
            'weeks', cs.weeks
        )
    ) as schedules
FROM courses c
LEFT JOIN course_schedules cs ON c.id = cs.course_id
GROUP BY c.id;
```

#### 学生选课视图

```sql
CREATE VIEW student_selections AS
SELECT
    s.id,
    s.user_id,
    s.course_id,
    s.status,
    s.selected_at,
    s.confirmed_at,
    s.cancelled_at,
    s.notes,
    u.username,
    u.email,
    up.first_name,
    up.last_name,
    cd.name as course_name,
    cd.code as course_code,
    cd.credits,
    cd.teacher,
    cd.schedules
FROM selections s
JOIN users u ON s.user_id = u.id
JOIN user_profiles up ON u.id = up.user_id
JOIN course_details cd ON s.course_id = cd.id;
```

## 前端架构

### 组件架构

#### 组件组织

```
src/
├── components/           # 可复用UI组件
│   ├── common/          # 通用组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Loading/
│   ├── forms/           # 表单组件
│   │   ├── LoginForm/
│   │   ├── CourseForm/
│   │   └── UserForm/
│   └── layout/          # 布局组件
│       ├── Header/
│       ├── Sidebar/
│       └── Footer/
├── pages/               # 页面组件
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── dashboard/
│   │   ├── StudentDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── courses/
│   │   ├── CourseList.tsx
│   │   ├── CourseDetail.tsx
│   │   └── CourseManagement.tsx
│   ├── selections/
│   │   ├── MySelections.tsx
│   │   └── SelectionHistory.tsx
│   └── profile/
│       ├── UserProfile.tsx
│       └── UserManagement.tsx
├── hooks/               # 自定义React Hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── services/            # API服务层
│   ├── api.ts
│   ├── authService.ts
│   ├── courseService.ts
│   └── selectionService.ts
├── stores/              # Redux状态管理
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── courseSlice.ts
│   │   └── selectionSlice.ts
│   └── store.ts
├── styles/              # 样式文件
│   ├── globals.css
│   ├── variables.css
│   └── components/
├── utils/               # 工具函数
│   ├── constants.ts
│   ├── helpers.ts
│   └── validators.ts
├── types/               # TypeScript类型定义
│   ├── api.ts
│   ├── auth.ts
│   └── course.ts
└── tests/               # 测试文件
    ├── components/
    ├── pages/
    └── utils/
```

#### 组件模板

```typescript
import React from 'react';
import { Button, Card, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  course: Course;
  onSelect?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onSelect,
  onViewDetails,
}) => {
  const { t } = useTranslation();

  const handleSelect = () => {
    onSelect?.(course.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(course.id);
  };

  return (
    <Card
      className={styles.courseCard}
      title={course.name}
      extra={<span>{course.code}</span>}
      actions={[
        <Button type="link" onClick={handleViewDetails}>
          {t('common.viewDetails')}
        </Button>,
        <Button type="primary" onClick={handleSelect}>
          {t('course.select')}
        </Button>,
      ]}
    >
      <Space direction="vertical">
        <div>
          <strong>{t('course.teacher')}:</strong> {course.teacher}
        </div>
        <div>
          <strong>{t('course.credits')}:</strong> {course.credits}
        </div>
        <div>
          <strong>{t('course.capacity')}:</strong> {course.enrolled}/{course.capacity}
        </div>
        {course.description && (
          <div className={styles.description}>
            {course.description}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default CourseCard;
```

### 状态管理架构

#### 状态结构

```typescript
interface RootState {
  auth: AuthState;
  courses: CourseState;
  selections: SelectionState;
  ui: UIState;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface CourseState {
  list: Course[];
  current: Course | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: CourseFilters;
}

interface SelectionState {
  list: Selection[];
  loading: boolean;
  error: string | null;
  conflicts: SelectionConflict[];
}

interface UIState {
  theme: 'light' | 'dark';
  language: string;
  sidebarCollapsed: boolean;
  notifications: Notification[];
}
```

#### 状态管理模式

- **Redux Toolkit**: 用于全局状态管理
- **RTK Query**: 处理异步API调用和缓存
- **React Context**: 用于组件间状态传递
- **本地状态**: 组件内部使用useState管理

### 路由架构

#### 路由组织

```
src/routes/
├── index.ts              # 路由配置入口
├── publicRoutes.tsx      # 公开路由
├── studentRoutes.tsx     # 学生路由
├── adminRoutes.tsx       # 管理员路由
├── ProtectedRoute.tsx    # 路由守卫组件
└── ErrorBoundary.tsx     # 错误边界组件
```

#### 受保护路由模式

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../stores/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### 前端服务层

#### API客户端设置

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { store } from '../stores/store';
import { logout } from '../stores/slices/authSlice';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          store.dispatch(logout());
          window.location.href = '/login';
        } else if (error.response?.data?.error?.message) {
          message.error(error.response.data.error.message);
        } else {
          message.error('网络错误，请稍后重试');
        }

        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

#### 服务示例

```typescript
import { apiClient } from './api';
import { Course, CourseFilters, CreateCourseRequest, UpdateCourseRequest } from '../types/course';

export const courseService = {
  // 获取课程列表
  getCourses: async (filters?: CourseFilters, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const response = await apiClient.get<{
      courses: Course[];
      pagination: any;
    }>(`/courses?${params}`);

    return response.data;
  },

  // 获取课程详情
  getCourse: async (courseId: string) => {
    const response = await apiClient.get<{ course: Course }>(`/courses/${courseId}`);
    return response.data.course;
  },

  // 创建课程
  createCourse: async (courseData: CreateCourseRequest) => {
    const response = await apiClient.post<{ course: Course }>('/courses', courseData);
    return response.data.course;
  },

  // 更新课程
  updateCourse: async (courseId: string, courseData: UpdateCourseRequest) => {
    const response = await apiClient.put<{ course: Course }>(`/courses/${courseId}`, courseData);
    return response.data.course;
  },

  // 删除课程
  deleteCourse: async (courseId: string) => {
    await apiClient.delete(`/courses/${courseId}`);
  },

  // 检查选课冲突
  checkConflicts: async (courseIds: string[]) => {
    const response = await apiClient.post<{
      hasConflicts: boolean;
      conflicts: any[];
    }>('/selections/check-conflicts', { courseIds });

    return response.data;
  },
};
```

## 后端架构

### 服务架构

基于Express.js的传统服务器架构，采用MVC模式和分层设计。

#### 控制器/路由组织

```
src/
├── controllers/          # 控制器层
│   ├── authController.ts
│   ├── userController.ts
│   ├── courseController.ts
│   ├── selectionController.ts
│   └── statisticsController.ts
├── services/            # 业务逻辑层
│   ├── authService.ts
│   ├── userService.ts
│   ├── courseService.ts
│   ├── selectionService.ts
│   └── statisticsService.ts
├── models/              # 数据模型层
│   ├── User.ts
│   ├── Course.ts
│   ├── Selection.ts
│   └── AuditLog.ts
├── middleware/          # 中间件
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── rateLimiter.ts
├── routes/              # 路由定义
│   ├── auth.ts
│   ├── users.ts
│   ├── courses.ts
│   ├── selections.ts
│   └── statistics.ts
├── utils/               # 工具函数
│   ├── database.ts
│   ├── redis.ts
│   ├── logger.ts
│   └── helpers.ts
├── config/              # 配置文件
│   ├── database.ts
│   ├── redis.ts
│   └── app.ts
├── types/               # 类型定义
│   ├── auth.ts
│   ├── user.ts
│   └── course.ts
└── tests/               # 测试文件
    ├── controllers/
    ├── services/
    └── utils/
```

#### 控制器模板

```typescript
import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { CreateCourseRequest, UpdateCourseRequest } from '../types/course';
import { ApiResponse } from '../utils/response';

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  // 获取课程列表
  public getCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, search, teacher, credits, status } = req.query;

      const filters = {
        search: search as string,
        teacher: teacher as string,
        credits: credits ? parseInt(credits as string) : undefined,
        status: status as string,
      };

      const result = await this.courseService.getCourses(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return ApiResponse.success(res, result, '获取课程列表成功');
    } catch (error) {
      next(error);
    }
  };

  // 获取课程详情
  public getCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const course = await this.courseService.getCourseById(courseId);

      if (!course) {
        return ApiResponse.notFound(res, '课程不存在');
      }

      return ApiResponse.success(res, { course }, '获取课程详情成功');
    } catch (error) {
      next(error);
    }
  };

  // 创建课程
  public createCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseData: CreateCourseRequest = req.body;
      const course = await this.courseService.createCourse(courseData);

      return ApiResponse.created(res, { course }, '创建课程成功');
    } catch (error) {
      next(error);
    }
  };

  // 更新课程
  public updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const courseData: UpdateCourseRequest = req.body;
      const course = await this.courseService.updateCourse(courseId, courseData);

      return ApiResponse.success(res, { course }, '更新课程成功');
    } catch (error) {
      next(error);
    }
  };

  // 删除课程
  public deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      await this.courseService.deleteCourse(courseId);

      return ApiResponse.success(res, null, '删除课程成功');
    } catch (error) {
      next(error);
    }
  };
}
```

### 数据库架构

#### 模式设计

使用TypeORM作为ORM，定义实体模型和关系映射：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Selection } from './Selection';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('tinyint', { unsigned: true })
  credits: number;

  @Column({ length: 100 })
  teacher: string;

  @Column('smallint', { unsigned: true })
  capacity: number;

  @Column('smallint', { unsigned: true, default: 0 })
  enrolled: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  })
  status: string;

  @OneToMany(() => Selection, selection => selection.course)
  selections: Selection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 数据访问层

```typescript
import { AppDataSource } from '../config/database';
import { Course } from '../models/Course';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { CreateCourseRequest, UpdateCourseRequest, CourseFilters } from '../types/course';

export class CourseRepository {
  private repository: Repository<Course>;

  constructor() {
    this.repository = AppDataSource.getRepository(Course);
  }

  async create(courseData: CreateCourseRequest): Promise<Course> {
    const course = this.repository.create(courseData);
    return await this.repository.save(course);
  }

  async findById(id: string): Promise<Course | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['schedules'],
    });
  }

  async findByCode(code: string): Promise<Course | null> {
    return await this.repository.findOne({
      where: { code },
    });
  }

  async findWithFilters(
    filters: CourseFilters,
    page: number,
    limit: number
  ): Promise<{ courses: Course[]; total: number }> {
    const where: FindOptionsWhere<Course> = {};

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    if (filters.teacher) {
      where.teacher = filters.teacher;
    }

    if (filters.credits) {
      where.credits = filters.credits;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [courses, total] = await this.repository.findAndCount({
      where,
      relations: ['schedules'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return { courses, total };
  }

  async update(id: string, courseData: UpdateCourseRequest): Promise<Course> {
    await this.repository.update(id, courseData);
    const course = await this.findById(id);
    if (!course) {
      throw new Error('课程不存在');
    }
    return course;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async incrementEnrolled(id: string): Promise<void> {
    await this.repository.increment({ id }, 'enrolled', 1);
  }

  async decrementEnrolled(id: string): Promise<void> {
    await this.repository.decrement({ id }, 'enrolled', 1);
  }
}
```

### 身份认证和授权架构

#### 认证流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Auth as 认证服务
    participant UserDB as 用户数据库
    participant Redis as Redis缓存
    participant Audit as 审计服务

    Client->>Auth: 登录请求 (用户名, 密码)
    Auth->>UserDB: 查询用户信息
    UserDB-->>Auth: 返回用户数据

    alt 用户不存在或密码错误
        Auth-->>Client: 返回认证失败
    else 认证成功
        Auth->>Redis: 存储用户会话
        Auth->>Audit: 记录登录日志
        Auth-->>Client: 返回JWT令牌
    end

    Client->>Auth: API请求 (Bearer Token)
    Auth->>Redis: 验证令牌
    Redis-->>Auth: 返回用户信息

    alt 令牌无效
        Auth-->>Client: 返回401未授权
    else 令牌有效
        Auth->>Audit: 记录API访问
        Auth-->>Client: 继续处理请求
    end
```

#### 中间件/守卫

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/response';
import { UserService } from '../services/userService';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return ApiResponse.unauthorized(res, '缺少认证令牌');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userService = new UserService();
    const user = await userService.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return ApiResponse.unauthorized(res, '用户不存在或已被禁用');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, '无效的认证令牌');
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, '用户未认证');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, '权限不足');
    }

    next();
  };
};
```

## 统一项目结构

```
course-selection-system/
├── .github/                    # CI/CD工作流
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # 应用程序包
│   ├── web/                    # 前端应用
│   │   ├── src/
│   │   │   ├── components/     # UI组件
│   │   │   ├── pages/          # 页面组件/路由
│   │   │   ├── hooks/          # 自定义React hooks
│   │   │   ├── services/       # API客户端服务
│   │   │   ├── stores/         # 状态管理
│   │   │   ├── styles/         # 全局样式/主题
│   │   │   └── utils/          # 前端工具函数
│   │   ├── public/             # 静态资源
│   │   ├── tests/              # 前端测试
│   │   └── package.json
│   └── api/                    # 后端应用
│       ├── src/
│       │   ├── routes/         # API路由/控制器
│       │   ├── services/       # 业务逻辑
│       │   ├── models/         # 数据模型
│       │   ├── middleware/     # Express/API中间件
│       │   ├── utils/          # 后端工具函数
│       │   └── server.ts       # 服务器入口
│       ├── tests/              # 后端测试
│       └── package.json
├── packages/                   # 共享包
│   ├── shared/                 # 共享类型/工具函数
│   │   ├── src/
│   │   │   ├── types/          # TypeScript接口
│   │   │   ├── constants/      # 共享常量
│   │   │   └── utils/          # 共享工具函数
│   │   └── package.json
│   ├── ui/                     # 共享UI组件
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # 共享配置
│       ├── eslint/
│       ├── typescript/
│       └── jest/
├── infrastructure/             # 基础设施代码
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── docker-compose.yml
│   └── k8s/
├── scripts/                    # 构建/部署脚本
│   ├── build.sh
│   ├── deploy.sh
│   └── test.sh
├── docs/                       # 文档
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── fullstack-architecture.md
│   └── api/
├── .env.example                # 环境变量模板
├── package.json                # 根package.json
├── turbo.json                  # Turborepo配置
└── README.md
```

## 开发工作流

### 本地开发设置

#### 前提条件

```bash
# 检查Node.js版本
node --version  # 应该 >= 18.0.0

# 检查npm版本
npm --version   # 应该 >= 8.0.0

# 检查Docker版本
docker --version

# 检查MySQL版本
mysql --version

# 检查Redis版本
redis-cli --version
```

#### 初始设置

```bash
# 克隆仓库
git clone <repository-url>
cd course-selection-system

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local

# 启动数据库服务
docker-compose up -d mysql redis

# 运行数据库迁移
npm run db:migrate

# 插入种子数据
npm run db:seed
```

#### 开发命令

```bash
# 启动所有服务
npm run dev

# 启动前端服务
npm run dev:web

# 启动后端服务
npm run dev:api

# 运行测试
npm run test

# 运行测试并监听变化
npm run test:watch

# 运行代码检查
npm run lint

# 运行类型检查
npm run type-check

# 构建项目
npm run build
```

### 环境配置

#### 必需的环境变量

```bash
# 前端环境变量 (.env.local)
REACT_APP_API_URL=http://localhost:3001/v1
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0

# 后端环境变量 (.env)
NODE_ENV=development
PORT=3001
API_VERSION=v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_selection
DB_USER=root
DB_PASSWORD=password
DATABASE_URL=mysql://root:password@localhost:3306/course_selection

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 文件存储配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 日志配置
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# 共享环境变量
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 部署架构

### 部署策略

**前端部署:**
- **平台:** Vercel/Netlify静态托管
- **构建命令:** `npm run build:web`
- **输出目录:** `apps/web/dist`
- **CDN/边缘:** Vercel Edge Network/CloudFlare

**后端部署:**
- **平台:** Docker容器化 + AWS ECS/阿里云容器服务
- **构建命令:** `npm run build:api`
- **部署方法:** 容器镜像 + Kubernetes

### CI/CD管道

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build:web

      - name: Build backend
        run: npm run build:api

      - name: Build Docker images
        run: |
          docker build -f infrastructure/docker/Dockerfile.frontend -t course-system-frontend:${{ github.sha }} .
          docker build -f infrastructure/docker/Dockerfile.backend -t course-system-backend:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push course-system-frontend:${{ github.sha }}
          docker push course-system-backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          # 部署脚本
          echo "Deploying to production..."
```

### 环境

| 环境 | 前端URL | 后端URL | 用途 |
|------|----------|----------|------|
| Development | http://localhost:3000 | http://localhost:3001 | 本地开发 |
| Staging | https://staging.course-system.example.com | https://staging-api.course-system.example.com | 预生产测试 |
| Production | https://course-system.example.com | https://api.course-system.example.com | 生产环境 |

## 安全和性能

### 安全要求

**前端安全:**
- CSP Headers: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
- XSS Prevention: React内置XSS防护 + 输入验证
- 安全存储: 敏感数据使用httpOnly Cookie，非敏感数据使用localStorage

**后端安全:**
- 输入验证: 使用Joi/Typeorm验证所有输入数据
- 速率限制: 100请求/15分钟窗口期
- CORS策略: 仅允许指定的源域名

**身份认证安全:**
- 令牌存储: HttpOnly Cookie + CSRF保护
- 会话管理: JWT + Refresh Token机制
- 密码策略: 最少8位，包含大小写字母、数字和特殊字符

### 性能优化

**前端性能:**
- 包大小目标: 首屏<1MB，总包大小<3MB
- 加载策略: 懒加载 + 代码分割 + 预加载关键资源
- 缓存策略: 浏览器缓存 + Service Worker + CDN缓存

**后端性能:**
- 响应时间目标: API响应时间<500ms
- 数据库优化: 索引优化 + 查询优化 + 连接池
- 缓存策略: Redis多层缓存 + 应用层缓存

## 测试策略

### 测试金字塔

```
    E2E Tests
    /        \
  Integration Tests
  /            \
Frontend Unit  Backend Unit
```

### 测试组织

#### 前端测试

```
apps/web/tests/
├── components/           # 组件测试
├── pages/               # 页面测试
├── hooks/               # 自定义钩子测试
├── services/            # 服务测试
├── utils/               # 工具函数测试
├── e2e/                 # 端到端测试
└── __mocks__/           # Mock文件
```

#### 后端测试

```
apps/api/tests/
├── controllers/         # 控制器测试
├── services/            # 业务逻辑测试
├── models/              # 模型测试
├── middleware/          # 中间件测试
├── integration/         # 集成测试
└── fixtures/            # 测试数据
```

#### E2E测试

```
tests/e2e/
├── auth/                # 认证相关测试
├── courses/             # 课程相关测试
├── selections/          # 选课相关测试
├── admin/               # 管理员功能测试
└── utils/               # 测试工具函数
```

### 测试示例

#### 前端组件测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../../stores/store';
import { CourseCard } from '../CourseCard';
import { Course } from '../../../types/course';

const mockCourse: Course = {
  id: '1',
  code: 'CS101',
  name: '计算机科学导论',
  description: '计算机科学基础课程',
  credits: 3,
  teacher: '张教授',
  capacity: 100,
  enrolled: 45,
  status: 'published',
  schedules: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CourseCard', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  it('应该正确显示课程信息', () => {
    renderWithProvider(<CourseCard course={mockCourse} />);

    expect(screen.getByText('计算机科学导论')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('张教授')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('45/100')).toBeInTheDocument();
  });

  it('点击选择按钮应该调用onSelect回调', () => {
    const mockOnSelect = jest.fn();
    renderWithProvider(<CourseCard course={mockCourse} onSelect={mockOnSelect} />);

    const selectButton = screen.getByText('选择课程');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });
});
```

#### 后端API测试

```typescript
import request from 'supertest';
import { app } from '../../src/server';
import { getRepository } from 'typeorm';
import { User } from '../../src/models/User';

describe('Auth Controller', () => {
  beforeEach(async () => {
    // 清理测试数据
    await getRepository(User).delete({});
  });

  describe('POST /auth/login', () => {
    it('应该成功登录有效的用户', async () => {
      // 创建测试用户
      const userRepository = getRepository(User);
      const testUser = userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        role: 'student',
        status: 'active',
      });
      await userRepository.save(testUser);

      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'password',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.username).toBe('testuser');
    });

    it('应该拒绝无效的用户名', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
```

#### E2E测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('学生选课流程', () => {
  test.beforeEach(async ({ page }) => {
    // 登录学生账户
    await page.goto('/login');
    await page.fill('[data-testid=username]', 'student001');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('应该能够浏览课程列表', async ({ page }) => {
    await page.click('[data-testid=courses-link]');
    await expect(page).toHaveURL('/courses');

    // 验证课程列表显示
    await expect(page.locator('[data-testid=course-card]')).toHaveCount.greaterThan(0);
  });

  test('应该能够成功选择课程', async ({ page }) => {
    await page.goto('/courses');

    // 点击第一门课程的选择按钮
    await page.click('[data-testid=course-card] [data-testid=select-button]:first-child');

    // 验证成功提示
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();

    // 验证课程列表更新
    const selectedButton = page.locator('[data-testid=course-card] [data-testid=selected-button]:first-child');
    await expect(selectedButton).toBeVisible();
  });

  test('应该检测选课时间冲突', async ({ page }) => {
    // 先选择一门在周一上午的课程
    await page.goto('/courses');
    await page.click('[data-testid=course-monday-morning] [data-testid=select-button]');

    // 尝试选择另一门同样在周一上午的课程
    await page.click('[data-testid=course-monday-morning-conflict] [data-testid=select-button]');

    // 验证冲突提示
    await expect(page.locator('[data-testid=conflict-modal]')).toBeVisible();
    await expect(page.locator('[data-testid=conflict-message]')).toContainText('时间冲突');
  });
});
```

## 编码标准

### 关键的全栈规则

- **类型共享:** 始终在packages/shared中定义类型并从那里导入
- **API调用:** 永远不要直接进行HTTP调用 - 使用服务层
- **环境变量:** 只通过配置对象访问，永远不要直接访问process.env
- **错误处理:** 所有API路由必须使用标准错误处理器
- **状态更新:** 永远不要直接改变状态 - 使用适当的状态管理模式
- **数据库查询:** 使用TypeORM而不是原生SQL查询（性能关键场景除外）
- **认证检查:** 所有受保护的API端点都必须有认证中间件
- **输入验证:** 所有用户输入都必须在控制器层进行验证
- **日志记录:** 所有重要操作都必须记录到审计日志
- **事务管理:** 涉及多个数据表的操作必须使用数据库事务

### 命名约定

| 元素 | 前端 | 后端 | 示例 |
|------|------|------|------|
| 组件 | PascalCase | - | `UserProfile.tsx` |
| 钩子 | camelCase with 'use' | - | `useAuth.ts` |
| API路由 | - | kebab-case | `/api/user-profile` |
| 数据库表 | - | snake_case | `user_profiles` |
| 文件名 | PascalCase (组件) | camelCase | `userService.ts` |
| 变量名 | camelCase | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 类型/接口 | PascalCase | PascalCase | `CourseSelection` |
| 枚举 | PascalCase | PascalCase | `UserRole` |

## 错误处理策略

### 错误流

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Gateway as API网关
    participant Service as 业务服务
    participant ErrorHandler as 错误处理器
    participant Logger as 日志服务
    participant Monitor as 监控服务

    Client->>Gateway: API请求
    Gateway->>Service: 转发请求

    alt 业务逻辑错误
        Service->>ErrorHandler: 抛出业务错误
        ErrorHandler->>Logger: 记录错误日志
        ErrorHandler->>Monitor: 发送错误指标
        ErrorHandler-->>Gateway: 格式化错误响应
        Gateway-->>Client: 错误响应
    else 系统错误
        Service->>ErrorHandler: 抛出系统错误
        ErrorHandler->>Logger: 记录错误堆栈
        ErrorHandler->>Monitor: 触发告警
        ErrorHandler-->>Gateway: 通用错误响应
        Gateway-->>Client: 500错误响应
    end
```

### 错误响应格式

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### 前端错误处理

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ErrorState {
  currentError: ApiError | null;
  errorHistory: ApiError[];
}

const errorSlice = createSlice({
  name: 'error',
  initialState: {
    currentError: null,
    errorHistory: [],
  } as ErrorState,
  reducers: {
    setError: (state, action: PayloadAction<ApiError>) => {
      state.currentError = action.payload;
      state.errorHistory.push(action.payload);

      // 只保留最近50个错误
      if (state.errorHistory.length > 50) {
        state.errorHistory.shift();
      }
    },
    clearError: (state) => {
      state.currentError = null;
    },
  },
});

export const { setError, clearError } = errorSlice.actions;
```

### 后端错误处理

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/response';

export interface AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: Record<string, any>;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message, code = 'INTERNAL_ERROR', details } = error;

  // 记录错误日志
  logger.error({
    message: error.message,
    stack: error.stack,
    code,
    details,
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // 开发环境返回堆栈信息
  if (process.env.NODE_ENV === 'development') {
    details = { ...details, stack: error.stack };
  }

  // 返回标准错误响应
  return ApiResponse.error(res, code, message, statusCode, details);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ApiResponse.notFound(res, '请求的资源不存在');
};
```

## 监控和可观察性

### 监控技术栈

- **前端监控:** Sentry错误追踪 + Google Analytics用户行为分析
- **后端监控:** Prometheus指标收集 + Grafana可视化仪表板
- **错误追踪:** Sentry全栈错误监控和告警
- **性能监控:** New Relic应用性能监控 + 自定义性能指标

### 关键指标

**前端指标:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript错误率和类型
- API响应时间分布
- 用户交互转化率
- 页面加载时间
- 用户会话时长

**后端指标:**
- 请求速率 (RPS)
- 错误率 (HTTP 5xx, 4xx)
- 响应时间百分位数 (P50, P95, P99)
- 数据库查询性能
- 活跃连接数
- 内存和CPU使用率
- 选课高峰期并发数

## 检查表结果报告

（此部分将在运行架构师检查表后填充）