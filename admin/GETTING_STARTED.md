# 管理后台项目初始化和运行指南

## 项目结构已创建完成

我已经为你创建了一个完整的基于 React + Ant Design 的管理后台项目，目录位于 `/workspace/projects/admin/`

## 快速开始

### 1. 进入项目目录

```bash
cd /workspace/projects/admin
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问：http://localhost:5173

### 4. 默认登录信息

- 用户名：admin
- 密码：admin123

## 功能模块

### ✅ 已实现功能

1. **登录认证**
   - 管理员登录
   - Token 管理
   - 自动路由守卫

2. **仪表盘（Dashboard）**
   - 总用户数、总车辆数、总订单数、总收入
   - 用户分布（需求方/车主）
   - 订单状态分布
   - 最近订单列表

3. **用户管理**
   - 用户列表展示
   - 角色筛选（需求方/车主）
   - 状态筛选（正常/禁用）
   - 状态更新（禁用/启用用户）

4. **车辆管理**
   - 车辆列表展示
   - 状态筛选（待审核/已通过/已拒绝）
   - 车辆审核（通过/拒绝）
   - 审核备注功能

5. **订单管理**
   - 订单列表展示
   - 状态筛选
   - 订单详情查看

6. **数据统计**
   - 综合统计数据
   - 用户分布
   - 订单完成率
   - 订单状态分布

## 技术栈

- **React 18** - UI 框架
- **Ant Design 5** - UI 组件库
- **React Router 6** - 路由管理
- **Zustand** - 状态管理
- **Axios** - HTTP 客户端
- **Vite** - 构建工具

## 项目文件说明

### 核心文件

```
admin/
├── src/
│   ├── api/                 # API 接口封装
│   │   ├── auth.ts         # 认证接口
│   │   ├── users.ts        # 用户管理接口
│   │   ├── vehicles.ts     # 车辆管理接口
│   │   ├── orders.ts       # 订单管理接口
│   │   └── statistics.ts   # 统计接口
│   ├── components/          # 公共组件
│   │   └── layout/         # 布局组件
│   │       └── MainLayout.tsx
│   ├── pages/               # 页面组件
│   │   ├── login.tsx       # 登录页
│   │   ├── dashboard/      # 仪表盘
│   │   ├── users/          # 用户管理
│   │   ├── vehicles/       # 车辆管理
│   │   ├── orders/         # 订单管理
│   │   └── statistics/     # 数据统计
│   ├── router/              # 路由配置
│   │   └── index.tsx
│   ├── stores/              # 状态管理
│   │   └── auth.ts         # 认证状态
│   ├── utils/               # 工具函数
│   │   └── request.ts      # Axios 封装
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖配置
```

## 后端 API 配置

### 代理配置

开发环境已通过 Vite 代理配置，自动将 `/api` 请求代理到 `http://localhost:3000`

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### 生产环境

生产环境需要修改 `src/utils/request.ts` 中的 `baseURL`：

```typescript
const service: AxiosInstance = axios.create({
  baseURL: 'http://your-production-domain.com/api',
  timeout: 30000,
})
```

## 需要配置的后端接口

### 1. 管理员登录接口

确保后端有以下接口：

```typescript
POST /api/admin/login
{
  "username": "admin",
  "password": "admin123"
}

// 返回
{
  "code": 200,
  "data": {
    "token": "xxx",
    "admin": {
      "id": "xxx",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### 2. 用户管理接口

```typescript
GET /api/admin/users?role=merchant&page=1&pageSize=10
PUT /api/admin/users/:id/status
```

### 3. 车辆管理接口

```typescript
GET /api/admin/vehicles?status=pending&page=1&pageSize=10
PUT /api/admin/vehicles/:id/review
```

### 4. 订单管理接口

```typescript
GET /api/admin/orders?status=completed&page=1&pageSize=10
```

### 5. 统计接口

```typescript
GET /api/admin/statistics
```

## 扩展功能

如需添加新功能：

1. **添加新页面**
   - 在 `src/pages/` 创建页面组件
   - 在 `src/router/index.tsx` 添加路由
   - 在 `src/api/` 添加 API 接口

2. **添加新 API**
   - 在 `src/api/` 创建接口文件
   - 使用 `request.get/post/put/delete` 调用

3. **添加状态管理**
   - 在 `src/stores/` 创建 store 文件
   - 使用 `create` 函数创建状态

## 部署

### 构建生产版本

```bash
pnpm build
```

构建产物位于 `dist/` 目录

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        root /path/to/admin/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 注意事项

1. **CORS 配置**
   - 确保后端配置了 CORS，允许管理后台域名访问

2. **环境变量**
   - 生产环境建议使用环境变量配置 API 地址

3. **权限控制**
   - 管理后台需要特殊的 API 权限
   - 建议在后端实现角色权限系统

4. **安全性**
   - 生产环境必须使用 HTTPS
   - Token 存储建议使用 HttpOnly Cookie

## 下一步

1. 安装依赖：`pnpm install`
2. 启动后端服务：`pnpm dev:server`（在小程序项目目录）
3. 启动管理后台：`cd admin && pnpm dev`
4. 使用默认账号登录测试

项目已经完全准备就绪，可以直接使用！
