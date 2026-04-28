# 无人车配送平台 v1.0 版本说明

## 版本信息

- **版本号**：v1.0
- **发布日期**：2026-04-27
- **版本类型**：正式版本
- **技术栈**：Taro 3.x + NestJS + PostgreSQL + TypeScript + Tailwind CSS

---

## 系统概述

无人车配送平台是一个基于Taro框架开发的小程序应用，连接需求方和运力方，提供无人车运输服务的业务撮合平台。系统支持微信小程序、抖音小程序、H5多端运行。

### 平台定位

**公共版核心功能**：
- 需求方发布运输需求
- 运力方提供无人车运输服务
- 平台提供撮合服务
- 智能路径规划和实时追踪

**企业版（已规划，待开发）**：
- 大客户仓储物流无人车配送
- 企业内部批量配送
- 车辆对外服务和转租
- 多租户架构支持

---

## 已实现功能

### 1. 需求方功能

#### 基础功能
- ✅ 用户注册和登录
- ✅ 发布运输需求
- ✅ 查看订单列表
- ✅ 查看订单详情
- ✅ 订单状态追踪

#### 高级功能
- ✅ 货品照片上传和AI分析
  - 使用doubao-seed-1-6-vision-250815模型
  - 自动识别货品名称、类型、重量、体积
  - 限制最多1张照片，降低token消耗
  - 强制更新表单数据，支持更换图片
- ✅ 实时追踪无人车位置
  - 车辆位置地图展示
  - 车辆移动轨迹（polyline）
  - H5端兼容处理（降级提示）

### 2. 运力方功能

#### 基础功能
- ✅ 用户注册和登录
- ✅ 查看可接订单
- ✅ 接单和配送
- ✅ 查看我的订单
- ✅ 订单完成确认

#### 车辆管理
- ✅ 我的车辆列表
- ✅ 车辆信息管理
- ✅ 车辆位置地图展示
- ✅ 车辆轨迹显示

#### 车机模拟服务
- ✅ 车机数据模拟
  - 新石器无人车模拟
  - 九识无人车模拟
  - 车辆位置随机移动
  - 保存车辆历史轨迹
  - 移动范围10公里，速度90-180 km/h

### 3. 平台功能

#### 地图服务
- ✅ 车辆位置地图
- ✅ 车辆轨迹显示
- ✅ 跨端兼容（微信/抖音/H5）
- ✅ H5端降级处理

#### AI分析服务
- ✅ 视觉模型集成
- ✅ 货品自动识别
- ✅ Token消耗优化
- ✅ 图片质量控制

#### 数据模拟
- ✅ 车辆数据模拟
- ✅ 实时位置更新
- ✅ 轨迹记录

---

## 已保存的方案（暂不开发）

### 1. 搬运服务撮合方案

**文件路径**：`docs/handling-service-solution.md`

**核心内容**：
- 平台提供免费撮合服务
- 搬运费用由发货人和搬运工自行协商
- 平台不计算和记录搬运费用
- 平台不具备无人车轨迹能力
- 搬运时间由发货人和收货人确认

**开发周期**：4周

**状态**：方案设计完成，暂不开发

---

### 2. 多场景订单合并与路径优化方案

**文件路径**：`docs/multi-order-optimization-solution.md`

**核心内容**：
- 4种业务场景：
  1. 大客户专属用车（多需求、一取货点、多送货点）
  2. 推荐新单合并（运力方已接单，智能推荐新单）
  3. 智能筛选接单大厅（推荐组合订单，需洽谈）
  4. 已谈单路径优化（多单已谈好，仅需路径优化）
- 车辆锁定机制
- 运费洽谈机制
- 路径优化算法（贪心/遗传/TSP）

**开发周期**：9周

**状态**：方案设计完成，暂不开发

---

### 3. 大客户仓储物流无人车配送平台方案

**文件路径**：`docs/enterprise-logistics-solution.md`

**核心内容**：
- 企业版vs公共版架构
- 4种核心场景：
  1. 企业内部批量配送（一车多装、多装多卸）
  2. 自有车辆接外部订单（闲置车辆对外服务）
  3. 车辆转租（短期/长期/按单转租）
  4. 发布外部需求（自有运力不足时让外部运力方接单）
- 多租户架构（数据隔离）
- 路径优化升级（20-50点批量配送）

**开发周期**：14周（集成开发）

**实施建议**：推荐与现有系统集成开发，而非独立开发

**状态**：方案设计完成，暂不开发

---

## 技术架构

### 前端架构

**技术栈**：
- Taro 3.x（多端框架）
- React 18
- TypeScript
- Tailwind CSS 4
- shadcn/ui（组件库）

**目录结构**：
```
src/
├── app.config.ts          # 应用配置
├── app.css               # 全局样式
├── design_guidelines.md   # 设计指南
├── components/           # 组件
│   └── ui/              # UI组件库
├── pages/               # 页面
│   ├── index/           # 首页
│   ├── merchant/        # 需求方页面
│   │   └── demands/     # 需求管理
│   │       └── publish.tsx  # 发布需求（含AI分析）
│   └── owner/           # 运力方页面
│       └── vehicles/    # 车辆管理
│           └── vehicle-map/  # 车辆地图
├── network/             # 网络请求封装
└── utils/               # 工具函数
```

**页面列表**：
- 首页（`src/pages/index/index.tsx`）
- 发布需求页（`src/pages/merchant/demands/publish.tsx`）
- 车辆地图页（`src/pages/owner/vehicles/vehicle-map/index.tsx`）
- 我的车辆页（`src/pages/owner/vehicles/index.tsx`）

### 后端架构

**技术栈**：
- NestJS
- TypeScript
- PostgreSQL
- Supabase

**目录结构**：
```
server/
├── src/
│   ├── main.ts                    # 入口文件
│   ├── app.module.ts              # 根模块
│   ├── modules/
│   │   ├── home/                  # 主模块
│   │   │   └── home.service.ts    # AI分析服务
│   │   └── vehicle-mock/          # 车机模拟模块
│   │       └── vehicle-mock.service.ts  # 车机模拟服务
│   └── ...                        # 其他模块
└── ...                            # 配置文件
```

**核心服务**：
- Home Service：AI分析服务
- Vehicle Mock Service：车机模拟服务

### 数据库设计

**核心表**：
- `users` - 用户表
- `demands` - 需求表
- `vehicles` - 车辆表
- `orders` - 订单表
- `vehicle_tracks` - 车辆轨迹表

---

## 开发规范

### 1. 包管理器

**强制使用pnpm**：
```bash
pnpm install           # 安装依赖
pnpm add <package>     # 安装生产依赖
pnpm add -D <package>  # 安装开发依赖
```

### 2. 命名规范

- 文件名：kebab-case（如 `user-profile.tsx`）
- 组件名：PascalCase（如 `UserProfile`）
- 变量/函数：camelCase（如 `getUserInfo`）
- 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）

### 3. 组件使用规范

**优先使用UI组件库**：
- 按钮：`@/components/ui/button`
- 输入框：`@/components/ui/input`
- 卡片：`@/components/ui/card`
- 对话框：`@/components/ui/dialog`
- 等等...

**禁止事项**：
- ❌ 用 `View/Text` 手搓通用组件
- ❌ 使用未在 `src/components/ui` 中定义的通用UI组件

### 4. 样式规范

**Tailwind优先**：
- 颜色、间距、圆角、边框等使用Tailwind类名
- 禁止硬编码px值（如 `w-[340px]`、`text-[14px]`）
- 禁止使用 `style={{ width: '200px' }}`

**CSS使用场景**：
- 动画
- 关键帧
- 复杂选择器
- 第三方组件覆盖

### 5. 网络请求规范

**使用Network封装**：
```typescript
import { Network } from '@/network'

// GET请求
const data = await Network.request({ url: '/api/hello' })

// POST请求
const result = await Network.request({
  url: '/api/user/login',
  method: 'POST',
  data: { username, password }
})
```

**禁止事项**：
- ❌ 直接使用 `Taro.request`
- ❌ 直接使用 `fetch`
- ❌ 硬编码 localhost 或域名

### 6. 跨端兼容规范

**平台检测**：
```typescript
// ✅ 正确
const isMiniApp = [Taro.ENV_TYPE.WEAPP, Taro.ENV_TYPE.TT].includes(Taro.getEnv())

// ❌ 错误（状态延迟）
const [isMiniApp, setIsMiniApp] = useState(false)
useEffect(() => { setIsMiniApp(...) }, [])
```

**Text组件换行**：
```tsx
// 垂直排列的Text必须添加block
<Text className="block text-lg font-semibold">标题</Text>
<Text className="block text-sm text-gray-500">说明</Text>
```

**Input样式**：
```tsx
// 必须View包裹，样式放View上
<View className="bg-gray-50 rounded-xl px-4 py-3">
  <Input className="w-full bg-transparent" placeholder="请输入内容" />
</View>
```

---

## 开发工具

### 1. Coze CLI

**项目初始化**：
```bash
coze init ${COZE_WORKSPACE_PATH} --template taro
```

**项目运行**：
```bash
coze dev    # 启动开发环境（前端5000端口，后端3000端口）
coze build  # 构建生产版本
```

### 2. 验证工具

**代码检查**：
```bash
pnpm validate  # TypeScript + ESLint检查（交付前强制执行）
pnpm tsc       # TypeScript类型检查
pnpm lint:build # 构建时Lint检查
```

**构建检查**：
```bash
pnpm build        # 构建生产版本
pnpm build:web    # 构建H5版本
pnpm build:weapp  # 构建微信小程序版本
pnpm build:tt     # 构建抖音小程序版本
```

---

## 已知问题

### 1. H5端地图兼容性

**问题描述**：
H5端地图组件不兼容，会报错 `TypeError: Cannot read properties of null (reading 'Map')`

**解决方案**：
已添加平台检测，H5端显示降级提示：
```tsx
{[Taro.ENV_TYPE.WEAPP, Taro.ENV_TYPE.TT].includes(Taro.getEnv()) ? (
  <Map className="w-full h-96" devicePosition="back" />
) : (
  <View className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
    <Text className="block text-gray-500 text-center">
      地图功能仅在小程序中可用{'\n'}请在小程序中打开体验完整功能
    </Text>
  </View>
)}
```

### 2. AI分析Token消耗

**问题描述**：
多张照片AI分析会报token超限错误

**解决方案**：
已限制最多1张照片，降低图片质量（`detail: 'low'`）

---

## 未来规划

### 短期（v1.1）

1. **功能完善**
   - 订单评价功能
   - 订单取消功能
   - 运费协商功能
   - 消息通知功能

2. **体验优化**
   - 页面加载速度优化
   - 地图交互优化
   - 错误提示优化

### 中期（v2.0）

1. **多订单合并**
   - 实现多场景订单合并与路径优化
   - 智能推荐功能
   - 运费洽谈功能

2. **搬运服务**
   - 实现搬运服务撮合
   - 搬运人员管理
   - 搬运费用协商

### 长期（v3.0）

1. **企业版**
   - 大客户仓储物流解决方案
   - 多租户架构
   - 批量配送和路径优化

2. **智能化升级**
   - AI路径规划
   - 自动调度系统
   - 智能定价

---

## 版本历史

### v1.0.0 (2026-04-27)

**初始版本发布**

**新增功能**：
- 需求方发布需求
- 货品照片上传和AI分析
- 运力方接单和配送
- 车辆位置地图展示
- 车机数据模拟服务
- 车辆轨迹显示

**技术特性**：
- Taro 3.x + NestJS架构
- 多端支持（微信/抖音/H5）
- TypeScript类型安全
- Tailwind CSS样式系统

---

## 联系方式

**技术支持**：
- 文档：`docs/` 目录
- 代码：`src/` 目录（前端）、`server/` 目录（后端）

**相关方案**：
- 搬运服务撮合方案：`docs/handling-service-solution.md`
- 多场景订单合并与路径优化方案：`docs/multi-order-optimization-solution.md`
- 大客户仓储物流无人车配送平台方案：`docs/enterprise-logistics-solution.md`

---

## 许可证

- 本项目为内部项目，未经授权不得外传
- 所有方案文档均为内部资料

---

**文档版本**：v1.0
**最后更新**：2026-04-27
