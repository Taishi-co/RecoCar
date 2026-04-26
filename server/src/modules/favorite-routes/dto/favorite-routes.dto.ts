import { z } from 'zod'

// 创建常用线路 DTO
export const createRouteSchema = z.object({
  user_id: z.string().min(1, '用户ID不能为空'),
  route_name: z.string().min(1, '线路名称不能为空'),
  pickup_address_id: z.string().optional(),
  delivery_address_id: z.string().optional(),
  pickup_address_name: z.string().optional(),
  pickup_address: z.string().optional(),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  delivery_address_name: z.string().optional(),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
})

export type CreateRouteDto = z.infer<typeof createRouteSchema>

// 更新常用线路 DTO
export const updateRouteSchema = z.object({
  route_name: z.string().optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
})

export type UpdateRouteDto = z.infer<typeof updateRouteSchema>
