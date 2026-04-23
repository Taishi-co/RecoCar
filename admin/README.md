# 无人车共享运营平台 - 管理后台

基于现有 NestJS 后端 API 的网页版管理后台。

## 技术栈

- **框架**: React 18 + Vite
- **UI组件**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP**: Axios
- **样式**: Less + CSS Modules

## 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
├── src/
│   ├── api/              # API 接口
│   │   ├── auth.ts      # 认证接口
│   │   ├── users.ts     # 用户管理接口
│   │   ├── vehicles.ts  # 车辆管理接口
│   │   ├── orders.ts    # 订单管理接口
│   │   └── statistics.ts # 统计接口
│   ├── components/      # 公共组件
│   │   ├── layout/      # 布局组件
│   │   └── common/      # 通用组件
│   ├── pages/           # 页面组件
│   │   ├── dashboard/   # 仪表盘
│   │   ├── users/       # 用户管理
│   │   ├── vehicles/    # 车辆管理
│   │   ├── orders/      # 订单管理
│   │   └── statistics/  # 数据统计
│   ├── stores/          # 状态管理
│   │   ├── auth.ts      # 认证状态
│   │   └── app.ts       # 应用状态
│   ├── router/          # 路由配置
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 入口文件
└── package.json
```

## 功能模块

### 1. 登录认证
- 管理员登录
- Token 管理
- 权限控制

### 2. 仪表盘
- 数据概览
- 快捷操作
- 实时统计

### 3. 用户管理
- 用户列表
- 状态管理
- 用户详情

### 4. 车辆管理
- 车辆列表
- 审核功能
- 车辆详情

### 5. 订单管理
- 订单列表
- 订单详情
- 订单操作

### 6. 数据统计
- 业务统计
- 图表展示
- 数据导出

## API 配置

在 `src/utils/request.ts` 中配置后端 API 地址：

```typescript
const BASE_URL = 'http://localhost:3000/api'
```

## 开发说明

### 添加新页面

1. 在 `src/pages/` 下创建页面目录
2. 在 `src/router/` 中添加路由
3. 在 `src/api/` 中添加对应的 API 接口

### 添加新API

```typescript
// src/api/example.ts
import request from '@/utils/request'

export function getExampleList(params: any) {
  return request.get('/example', { params })
}
```

## 部署

### 构建

```bash
npm run build
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        root /path/to/dist;
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

1. 确保后端服务已启动
2. 修改 API 地址为实际的后端地址
3. 配置 CORS 跨域（后端）
4. 生产环境需要配置 HTTPS

## License

MIT
