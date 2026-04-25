# 数据库导出摘要

## 导出时间
2026-04-25 07:40:11 (UTC)

## 导出文件位置
- 表结构: `/workspace/projects/database-export/schema-2026-04-25T07-40-08-565Z.sql`
- 数据: `/workspace/projects/database-export/data-2026-04-25T07-40-08-565Z.json`

---

## 数据库统计

| 表名 | 记录数 | 说明 |
|------|--------|------|
| users | 6 | 用户表（车主/需求方/管理员） |
| demands | 25 | 需求表 |
| vehicles | 7 | 车辆表 |
| orders | 12 | 订单表 |
| cancellation_requests | 6 | 取消申请表 |
| notifications | 33 | 通知表 |
| platform_settings | 1 | 平台配置表 |
| **总计** | **90** | **总记录数** |

---

## 表结构说明

### 1. users（用户表）
记录所有用户信息，包括车主、需求方和管理员

**主要字段**：
- `id`: 用户唯一标识
- `phone`: 手机号
- `password`: 加密密码
- `role`: 角色（owner/merchant/admin）
- `name`: 用户姓名
- `credit_score`: 信用积分
- `wechat_payment_qr`: 微信收款码
- `status`: 状态（active/inactive）

**用户分布**：
- 车主（owner）: 3 位
- 需求方（merchant）: 2 位
- 管理员（admin）: 1 位

### 2. demands（需求表）
记录需求方发布的物流需求

**主要字段**：
- `id`: 需求唯一标识
- `merchant_id`: 需求方ID
- `cargo_name`: 货品名称
- `pickup_address`: 取货地址
- `delivery_address`: 送货地址
- `status`: 状态（pending/accepted/in_transit/completed/cancelled）

### 3. vehicles（车辆表）
记录车主注册的车辆信息

**主要字段**：
- `id`: 车辆唯一标识
- `owner_id`: 车主ID
- `vehicle_number`: 车牌号
- `vehicle_type`: 车辆类型
- `status`: 状态（active/inactive）
- `trip_status`: 运输状态（idle/busy）
- `photos`: 车辆照片（JSON数组）

### 4. orders（订单表）
记录所有订单信息

**主要字段**：
- `id`: 订单唯一标识
- `demand_id`: 需求ID
- `vehicle_id`: 车辆ID
- `merchant_id`: 需求方ID
- `owner_id`: 车主ID
- `fare_price`: 运费金额
- `commission_amount`: 佣金金额
- `status`: 订单状态
- `payment_status`: 付款状态
- `commission_payment_status`: 佣金付款状态

### 5. cancellation_requests（取消申请表）
记录订单取消申请

**主要字段**：
- `id`: 申请唯一标识
- `order_id`: 订单ID
- `requestor_id`: 申请人ID（需求方）
- `responder_id`: 处理人ID（车主）
- `reason`: 取消原因
- `status`: 状态（pending/approved/rejected）
- `response_reason`: 处理原因

### 6. notifications（通知表）
记录所有用户通知

**主要字段**：
- `id`: 通知唯一标识
- `user_id`: 用户ID
- `type`: 通知类型
- `title`: 通知标题
- `content`: 通知内容
- `is_read`: 是否已读

### 7. platform_settings（平台配置表）
记录平台配置信息

**主要字段**：
- `id`: 配置ID
- `commission_rate`: 佣金比例
- `commission_payment_qr`: 佣金收款码

---

## 数据示例

### 用户数据
```json
{
  "id": "6a6ef695-dc50-4315-b44f-a24da3778ebd",
  "phone": "13900139000",
  "role": "owner",
  "name": "测试车主2",
  "credit_score": 100,
  "wechat_payment_qr": null
}
```

### 订单数据
```json
{
  "id": "订单ID",
  "demand_id": "需求ID",
  "vehicle_id": "车辆ID",
  "merchant_id": "需求方ID",
  "owner_id": "车主ID",
  "fare_price": 10000.00,
  "commission_amount": 500.00,
  "status": "completed",
  "payment_status": "paid"
}
```

---

## 如何使用导出的数据

### 1. 导入到其他数据库
```bash
# 导入表结构
psql -U username -d database_name < schema-2026-04-25T07-40-08-565Z.sql

# 导入数据
node import-data.js data-2026-04-25T07-40-08-565Z.json
```

### 2. 数据分析
使用 JSON 文件进行数据分析：
- 订单量统计
- 用户活跃度分析
- 收入分析
- 信用积分分析

### 3. 数据备份
定期导出数据库作为备份：
```bash
npx tsx export-database.ts
```

---

## 注意事项

1. **密码安全**: 所有密码都已加密（bcrypt），导出时不会泄露明文密码
2. **数据完整性**: 导出的数据包含所有关系和引用
3. **时间戳**: 所有时间字段都使用 ISO 8601 格式
4. **敏感信息**: 个人信息（如身份证号）在数据库中为 null，符合隐私保护要求

---

## 导出命令

```bash
# 运行导出脚本
cd /workspace/projects
npx tsx export-database.ts
```

---

导出完成！如有需要可以重复执行导出命令。
