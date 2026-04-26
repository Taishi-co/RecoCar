import { z } from 'zod'

// 创建车辆 DTO
export const createVehicleSchema = z.object({
  owner_id: z.string().min(1, '车主ID不能为空'),
  vehicle_type: z.string().min(1, '车型不能为空'),
  license_plate: z.string().min(1, '车牌号不能为空'),
  load_capacity: z.string().min(1, '载重不能为空'),
  volume: z.string().min(1, '体积不能为空'),
  battery_life: z.string().min(1, '续航不能为空'),
  has_cold_chain: z.string().optional(), // 是否有冷链能力，字符串形式 'true' 或 'false'
  operation_area: z.string().optional(), // JSON 字符串
  available_hours: z.string().optional(), // JSON 字符串
  photoUrls: z.array(z.string()).optional(), // 车辆照片URL数组
  // 定价参数
  base_price: z.number().min(10).max(500).default(20), // 起步价
  base_distance: z.number().min(1).max(10).default(3), // 起步公里数
  price_per_km: z.number().min(0.5).max(20).default(2), // 每公里运价
})

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>

// 更新车辆 DTO
export const updateVehicleSchema = z.object({
  vehicle_type: z.string().optional(),
  license_plate: z.string().optional(),
  load_capacity: z.string().optional(),
  volume: z.string().optional(),
  battery_life: z.string().optional(),
  has_cold_chain: z.string().optional(),
  operation_area: z.string().optional(),
  available_hours: z.string().optional(),
  photoUrls: z.array(z.string()).optional(), // 车辆照片URL数组
  // 定价参数
  base_price: z.number().min(10).max(500).optional(), // 起步价
  base_distance: z.number().min(1).max(10).optional(), // 起步公里数
  price_per_km: z.number().min(0.5).max(20).optional(), // 每公里运价
})

export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>
