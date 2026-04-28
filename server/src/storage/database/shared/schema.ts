import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  jsonb,
  numeric,
  index,
  text,
  serial,
} from "drizzle-orm/pg-core";

// 健康检查表（系统保留，禁止删除）
export const healthCheck = pgTable(
  "health_check",
  {
    id: serial().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  }
);

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 11 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // owner/merchant/admin
    name: varchar("name", { length: 50 }).notNull(),
    id_card: varchar("id_card", { length: 18 }), // 仅车主收集
    merchant_type: varchar("merchant_type", { length: 20 }), // shop/individual/rental，仅需求方
    address: text("address"), // 常用地址，仅需求方
    avatar: varchar("avatar", { length: 255 }), // 头像URL
    status: varchar("status", { length: 20 }).notNull().default("active"), // active/disabled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_phone_idx").on(table.phone),
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
  ]
);

// 车辆表
export const vehicles = pgTable(
  "vehicles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    owner_id: varchar("owner_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    vehicle_type: varchar("vehicle_type", { length: 50 }).notNull(), // 车型
    load_capacity: numeric("load_capacity", { precision: 10, scale: 2 }).notNull(), // 载重（公斤）
    volume: numeric("volume", { precision: 10, scale: 2 }).notNull(), // 体积（立方米）
    battery_life: numeric("battery_life", { precision: 10, scale: 2 }).notNull(), // 续航（公里）
    operation_area: jsonb("operation_area"), // 运营区域（多边形坐标）
    available_hours: jsonb("available_hours"), // 可接单时段
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending（待审核）/active（可用）/inactive（不可用）
    photos: jsonb("photos"), // 车辆照片（TOS key数组）
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("vehicles_owner_id_idx").on(table.owner_id),
    index("vehicles_status_idx").on(table.status),
  ]
);

// 需求表
export const demands = pgTable(
  "demands",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    merchant_id: varchar("merchant_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    cargo_name: varchar("cargo_name", { length: 100 }).notNull(), // 货品名称
    cargo_type: varchar("cargo_type", { length: 20 }).notNull(), // normal/fresh/fragile
    weight: numeric("weight", { precision: 10, scale: 2 }).notNull(), // 重量（公斤）
    volume: numeric("volume", { precision: 10, scale: 2 }).notNull(), // 体积（立方米）
    pickup_time: timestamp("pickup_time", { withTimezone: true }).notNull(), // 取货时间
    pickup_address: varchar("pickup_address", { length: 255 }).notNull(), // 取货地址
    pickup_location: jsonb("pickup_location"), // 取货位置坐标 {lat, lng}
    delivery_address: varchar("delivery_address", { length: 255 }).notNull(), // 送货地址
    delivery_location: jsonb("delivery_location"), // 送货位置坐标 {lat, lng}
    remarks: text("remarks"), // 备注
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/accepted/in_transit/completed/cancelled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("demands_merchant_id_idx").on(table.merchant_id),
    index("demands_status_idx").on(table.status),
    index("demands_pickup_time_idx").on(table.pickup_time),
  ]
);

// 订单表
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    demand_id: varchar("demand_id", { length: 36 }).notNull().references(() => demands.id, { onDelete: "cascade" }),
    vehicle_id: varchar("vehicle_id", { length: 36 }).references(() => vehicles.id, { onDelete: "set null" }),
    merchant_id: varchar("merchant_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    owner_id: varchar("owner_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/accepted/in_transit/completed/cancelled
    pickup_photo_key: varchar("pickup_photo_key", { length: 255 }), // 取货照片（TOS key）
    delivery_photo_key: varchar("delivery_photo_key", { length: 255 }), // 送货照片（TOS key）
    delivery_proof_key: varchar("delivery_proof_key", { length: 255 }), // 收货凭证（TOS key）
    cancel_reason: text("cancel_reason"), // 取消原因
    cancel_time: timestamp("cancel_time", { withTimezone: true }), // 取消时间
    accept_time: timestamp("accept_time", { withTimezone: true }), // 接单时间
    complete_time: timestamp("complete_time", { withTimezone: true }), // 完成时间
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_demand_id_idx").on(table.demand_id),
    index("orders_vehicle_id_idx").on(table.vehicle_id),
    index("orders_merchant_id_idx").on(table.merchant_id),
    index("orders_owner_id_idx").on(table.owner_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
  ]
);

// 企业表
export const enterprises = pgTable(
  "enterprises",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // dairy, logistics
    status: varchar("status", { length: 20 }).notNull().default("active"), // active/disabled
    admin_id: varchar("admin_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // 企业管理员
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("enterprises_type_idx").on(table.type),
    index("enterprises_status_idx").on(table.status),
    index("enterprises_admin_id_idx").on(table.admin_id),
  ]
);

// 奶站表
export const dairyStations = pgTable(
  "dairy_stations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    enterprise_id: varchar("enterprise_id", { length: 36 }).notNull().references(() => enterprises.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    address: varchar("address", { length: 255 }).notNull(),
    location: jsonb("location"), // {lat, lng}
    phone: varchar("phone", { length: 20 }),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active/disabled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("dairy_stations_enterprise_id_idx").on(table.enterprise_id),
    index("dairy_stations_status_idx").on(table.status),
  ]
);

// 企业配送需求表
export const enterpriseDemands = pgTable(
  "enterprise_demands",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    enterprise_id: varchar("enterprise_id", { length: 36 }).notNull().references(() => enterprises.id, { onDelete: "cascade" }),
    pickup_point_type: varchar("pickup_point_type", { length: 20 }).notNull(), // warehouse, station
    pickup_point_info: jsonb("pickup_point_info").notNull(), // {type, name, address, contact, phone, location}
    delivery_points: jsonb("delivery_points").notNull(), // [{type, name, address, contact, phone, location, cargo}]
    cargo_info: jsonb("cargo_info").notNull(), // {totalWeight, totalVolume}
    time_window: jsonb("time_window").notNull(), // {expectedTime, startTime, endTime}
    vehicle_source: varchar("vehicle_source", { length: 20 }).notNull(), // own, external, mixed
    vehicle_allocation: jsonb("vehicle_allocation"), // {ownVehicleIds, externalVehicleIds}
    optimized_routes: jsonb("optimized_routes"), // [{vehicleId, route, points}]
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, dispatched, in_transit, completed, cancelled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("enterprise_demands_enterprise_id_idx").on(table.enterprise_id),
    index("enterprise_demands_status_idx").on(table.status),
    index("enterprise_demands_created_at_idx").on(table.created_at),
  ]
);
