# API规范

## REST API规范

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
