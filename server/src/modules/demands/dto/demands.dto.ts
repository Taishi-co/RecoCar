import { z } from 'zod'

// 创建需求 DTO
export const createDemandSchema = z.object({
  merchant_id: z.string().min(1, '需求方ID不能为空'),
  cargo_name: z.string().min(1, '货品名称不能为空'),
  cargo_type: z.enum(['normal', 'fresh', 'fragile'], {
    message: '货品类型必须为 normal/fresh/fragile'
  }),
  weight: z.string().min(1, '重量不能为空'),
  volume: z.string().min(1, '体积不能为空'),
  pickup_time: z.string().min(1, '取货时间不能为空'),
  pickup_address: z.string().min(1, '取货地址不能为空'),
  pickup_location: z.string().optional(), // JSON 字符串 {lat, lng}
  delivery_address: z.string().min(1, '送货地址不能为空'),
  delivery_location: z.string().optional(), // JSON 字符串 {lat, lng}
  remarks: z.string().optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
})

export type CreateDemandDto = z.infer<typeof createDemandSchema>

// 更新需求 DTO
export const updateDemandSchema = z.object({
  cargo_name: z.string().min(1, '货品名称不能为空'),
  cargo_type: z.string().optional(),
  weight: z.string().optional(),
  volume: z.string().optional(),
  pickup_time: z.string().optional(),
  pickup_address: z.string().optional(),
  pickup_location: z.string().optional(),
  delivery_address: z.string().optional(),
  delivery_location: z.string().optional(),
  remarks: z.string().optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
})

export type UpdateDemandDto = z.infer<typeof updateDemandSchema>
