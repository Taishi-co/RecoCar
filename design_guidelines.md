# 无人车共享运营平台 V1.0 设计指南

## 品牌定位

### 应用定位
无人车共享运营平台，连接运力方（车主）与需求方（商铺/货主/租车方），实现高效运力撮合与线下结算，快速验证市场。

### 设计风格
- 简洁高效：突出核心功能，减少认知负担
- 专业可信：强调平台的专业性和可靠性
- 便捷实用：操作流程简单直观，提升用户体验

### 目标用户
- 运力方：无人车车主，关注接单效率和收益管理
- 需求方：商铺、货主、租车方，关注快速匹配和订单追踪
- 运营方：平台管理员，关注数据统计和风险控制

## 配色方案

### 主色调（蓝色系 - 专业可信）
```css
--primary: #1890ff;           /* 主色 - 科技蓝 */
--primary-hover: #40a9ff;     /* 主色悬停 */
--primary-light: #e6f7ff;     /* 浅色背景 */
```

### 功能色
```css
--success: #52c41a;           /* 成功 - 绿色 */
--warning: #faad14;           /* 警告 - 橙色 */
--danger: #ff4d4f;            /* 危险/错误 - 红色 */
```

### 中性色
```css
--text-primary: #262626;      /* 主文本 */
--text-secondary: #595959;    /* 次级文本 */
--text-tertiary: #8c8c8c;     /* 辅助文本 */
--border: #d9d9d9;            /* 边框 */
--bg-page: #f5f5f5;           /* 页面背景 */
--bg-card: #ffffff;           /* 卡片背景 */
```

### Tailwind 类名映射
```css
bg-blue-500 / text-blue-500   /* 主色 */
bg-green-500 / text-green-500 /* 成功 */
bg-orange-500 / text-orange-500 /* 警告 */
bg-red-500 / text-red-500     /* 危险 */
bg-gray-100 / text-gray-900   /* 页面背景 */
bg-white                      /* 卡片背景 */
border-gray-200               /* 边框 */
```

## 字体规范

| 层级   | Tailwind 类名      | 使用场景                 |
| ------ | ------------------ | ------------------------ |
| H1     | text-2xl font-bold | 页面标题                 |
| H2     | text-xl font-bold  | 卡片标题、模块标题       |
| H3     | text-lg font-semibold | 子标题、区块标题      |
| Body   | text-sm            | 正文内容                 |
| Caption| text-xs            | 辅助说明、时间戳         |

## 间距系统

### 页面边距
- 标准页面：`p-4` (16px)
- 紧凑页面：`p-3` (12px)

### 卡片内边距
- 标准卡片：`p-4` (16px)
- 紧凑卡片：`p-3` (12px)
- 疏松卡片：`p-5` (20px)

### 组件间距
- 垂直间距：`gap-3` (12px) 或 `gap-4` (16px)
- 水平间距：`gap-3` (12px) 或 `gap-4` (16px)

### 列表间距
- 列表项间距：`mb-3` (12px)
- 分组间距：`my-4` (16px)

## 组件使用原则

### 优先使用 @/components/ui/* 组件

**必须优先使用的通用组件：**
- Button：所有按钮（提交、确认、取消、操作入口）
- Input：单行输入框（手机号、验证码、金额）
- Textarea：多行输入框（备注、描述）
- Card：信息卡片、列表项容器、模块分组
- Badge：状态标签（订单状态、审核状态）
- Tabs：标签切换（订单状态筛选、角色切换）
- Dialog：弹窗（表单弹层、信息确认）
- Toast：操作结果提示、失败提醒
- Select：下拉选择器（车型选择、类型选择）
- Switch：开关设置（车辆状态切换）
- Progress：进度条（上传进度、任务进度）
- Skeleton：加载骨架屏
- Separator：分割线、内容区块分隔

**禁止事项：**
- 禁止用 `View/Text` 手搓按钮、输入框、卡片、标签等通用 UI
- 组件库缺失时，优先补齐到 `@/components/ui/*`，不要在页面里临时造轮子

### 容器样式规范

### 卡片样式
```tsx
// 标准卡片
<Card className="bg-white rounded-lg shadow-sm">
  <CardContent className="p-4">
    {/* 内容 */}
  </CardContent>
</Card>

// 带标题卡片
<Card className="bg-white rounded-lg shadow-sm">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold">标题</CardTitle>
  </CardHeader>
  <CardContent className="p-4 pt-0">
    {/* 内容 */}
  </CardContent>
</Card>
```

### 表单样式
```tsx
// 表单项
<View className="mb-4">
  <Label className="block text-sm font-medium mb-2">标签</Label>
  <Input className="w-full bg-gray-50" placeholder="请输入..." />
</View>

// 必填项标识
<View className="mb-4">
  <Label className="block text-sm font-medium mb-2">
    <Text className="text-red-500">*</Text>标签
  </Label>
  <Input className="w-full bg-gray-50" placeholder="请输入..." />
</View>
```

### 状态标签
```tsx
// 订单状态
<Badge variant={status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
  {statusText}
</Badge>

// 自定义状态颜色
<Badge className="bg-green-500 text-white">已完成</Badge>
```

## 导航结构

### 角色分离设计

**登录页面**：
- 角色选择：运力方（车主）/ 需求方 / 运营方
- 登录后根据角色跳转到对应首页

**运力方（车主）端 TabBar**：
```
首页（车辆管理） | 订单 | 统计 | 我的
```

**需求方端 TabBar**：
```
首页（发布需求） | 订单 | 统计 | 我的
```

**运营方端 TabBar**：
```
用户管理 | 订单管理 | 数据统计 | 设置
```

### TabBar 配置
```typescript
// 蓝色系主色
tabBar: {
  color: '#8c8c8c',              // 未选中：灰色
  selectedColor: '#1890ff',      // 选中：蓝色
  backgroundColor: '#ffffff',
  borderStyle: 'black'
}
```

### 页面跳转规范
- TabBar 切换：`Taro.switchTab()`
- 普通页面跳转：`Taro.navigateTo()`
- 返回上一页：`Taro.navigateBack()`

## 状态展示规范

### 加载态
```tsx
// 使用 Skeleton 组件
<Skeleton className="h-12 w-full" />
<Skeleton className="h-20 w-full" />
```

### 空状态
```tsx
<View className="flex flex-col items-center justify-center py-12">
  <Text className="text-gray-400 text-sm">暂无数据</Text>
</View>
```

### 错误状态
```tsx
<Alert variant="destructive">
  <Text>操作失败，请重试</Text>
</Alert>
```

## 小程序约束

### 包体积限制
- 主包 ≤ 2MB
- 总包 ≤ 20MB
- 图片使用对象存储，禁止打包到项目中

### 图片策略
- 车辆照片、货品照片、收货凭证：上传到 TOS 对象存储
- TabBar 图标：本地 PNG（小程序强制要求）
- 其他图片：TOS 对象存储

### 性能优化
- 长列表使用虚拟列表
- 图片使用 `lazyLoad` 懒加载
- 合理分包加载

## 交互规范

### 按钮交互
- 主操作：蓝色主按钮 `bg-blue-500`
- 次要操作：灰色按钮 `bg-gray-200`
- 危险操作：红色按钮 `bg-red-500`
- 禁用状态：`opacity-50` + 禁用点击

### 表单交互
- 实时验证：输入时给出错误提示
- 必填项：红色 * 标识
- 提交前：完整验证所有必填项

### 反馈提示
- 成功：绿色 Toast + Sonner
- 失败：红色 Toast + 明确错误原因
- 加载中：按钮显示 loading 状态

## 订单状态流转

### 运力方订单状态
- 待接单（pending）：显示需求详情，可接单
- 已接单（accepted）：显示需求方信息，可联系
- 运输中（in_transit）：显示运输进度
- 已完成（completed）：显示收益，可评价
- 已取消（cancelled）：显示取消原因

### 需求方订单状态
- 待接单（pending）：等待车主接单
- 已接单（accepted）：显示车主信息
- 运输中（in_transit）：可查看运输进度
- 已完成（completed）：可上传收货凭证
- 已取消（cancelled）：显示取消原因

### 状态颜色映射
```typescript
const statusColorMap = {
  pending: 'bg-yellow-500',      // 待接单 - 黄色
  accepted: 'bg-blue-500',       // 已接单 - 蓝色
  in_transit: 'bg-purple-500',   // 运输中 - 紫色
  completed: 'bg-green-500',     // 已完成 - 绿色
  cancelled: 'bg-red-500'        // 已取消 - 红色
}
```
