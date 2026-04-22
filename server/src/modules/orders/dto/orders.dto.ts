import { z } from 'zod'

// 创建订单 DTO
export const createOrderSchema = z.object({
  demand_id: z.string().min(1, '需求ID不能为空'),
  vehicle_id: z.string().min(1, '车辆ID不能为空'),
  owner_id: z.string().min(1, '车主ID不能为空'),
})

export type CreateOrderDto = z.infer<typeof createOrderSchema>
