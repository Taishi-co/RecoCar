import { z } from 'zod'

// 创建车辆 DTO
export const createVehicleSchema = z.object({
  owner_id: z.string().min(1, '车主ID不能为空'),
  vehicle_type: z.string().min(1, '车型不能为空'),
  load_capacity: z.string().min(1, '载重不能为空'),
  volume: z.string().min(1, '体积不能为空'),
  battery_life: z.string().min(1, '续航不能为空'),
  operation_area: z.string().optional(), // JSON 字符串
  available_hours: z.string().optional(), // JSON 字符串
})

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>

// 更新车辆 DTO
export const updateVehicleSchema = z.object({
  vehicle_type: z.string().min(1, '车型不能为空'),
  load_capacity: z.string().optional(),
  volume: z.string().optional(),
  battery_life: z.string().optional(),
  operation_area: z.string().optional(),
  available_hours: z.string().optional(),
})

export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>
