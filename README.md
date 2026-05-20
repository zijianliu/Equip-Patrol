# 企业设备巡检管理系统

一个基于 Node.js + React 的企业设备巡检管理全栈应用。

## 技术栈

### 后端
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- JWT 认证
- express-validator 参数校验

### 前端
- React 18 + TypeScript
- Ant Design 5
- React Router 6
- Vite 构建工具

## 功能特性

### 1. 设备管理
- 设备列表、详情、新增、编辑、删除
- 设备字段：设备编号、名称、园区、楼栋、楼层、设备类型、运行状态、最近巡检时间
- 设备编号唯一校验
- 删除前检查未完成任务和未关闭工单
- 支持搜索、筛选、分页

### 2. 巡检计划
- 创建、编辑、启用、停用巡检计划
- 支持每日、每周、每月巡检周期
- 关联多个设备
- 计划停用后不生成新任务，保留历史任务

### 3. 巡检任务
- 根据计划自动生成巡检任务
- 检查项：外观检查、运行状态、温度状态、噪音状态、安全隐患
- 巡检员只能查看分配给自己的任务
- 提交巡检结果，支持图片上传
- 异常时自动生成维修工单
- 更新设备最近巡检时间

### 4. 维修工单
- 异常巡检自动生成工单
- 同一个任务只生成一个工单
- 维修人员只能查看分配给自己的工单
- 更新工单状态和处理备注
- 工单关闭记录关闭时间

### 5. 权限控制
- 管理员：全部权限
- 巡检员：查看和提交自己的巡检任务
- 维修员：查看和处理自己的维修工单
- 普通用户：无管理权限

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 初始化数据库

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. 启动服务

```bash
# 启动后端 (端口 3001)
cd backend
npm run dev

# 启动前端 (端口 3000)
cd frontend
npm run dev
```

### 4. 访问系统

打开浏览器访问 http://localhost:3000

### 测试账号

```
管理员: admin / 123456
巡检员: inspector / 123456
维修员: maintenance / 123456
普通用户: user / 123456
```

## 项目结构

```
EquipPro/
├── backend/
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/    # 中间件
│   │   ├── lib/          # 公共库
│   │   ├── types/        # 类型定义
│   │   └── __tests__/   # 测试文件
│   ├── prisma/             # 数据库模型和迁移
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── context/       # React Context
│   │   ├── layouts/       # 布局组件
│   │   ├── utils/         # 工具函数
│   │   └── types/        # 类型定义
│   └── package.json
└── README.md
```

## 主要 API 接口

### 认证
- POST /api/auth/login - 登录
- GET /api/auth/profile - 获取用户信息

### 设备管理
- GET /api/devices - 获取设备列表
- GET /api/devices/:id - 获取设备详情
- POST /api/devices - 创建设备
- PUT /api/devices/:id - 更新设备
- DELETE /api/devices/:id - 删除设备

### 巡检计划
- GET /api/inspection-plans - 获取计划列表
- GET /api/inspection-plans/:id - 获取计划详情
- POST /api/inspection-plans - 创建计划
- PUT /api/inspection-plans/:id - 更新计划
- POST /api/inspection-plans/:id/toggle-status - 启用/停用计划

### 巡检任务
- GET /api/inspection-tasks - 获取任务列表
- GET /api/inspection-tasks/:id - 获取任务详情
- POST /api/inspection-tasks/:id/submit - 提交巡检结果

### 维修工单
- GET /api/work-orders - 获取工单列表
- GET /api/work-orders/:id - 获取工单详情
- PUT /api/work-orders/:id - 更新工单
