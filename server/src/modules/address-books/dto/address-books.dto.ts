import { z } from 'zod'

// 创建地址 DTO
export const createAddressSchema = z.object({
  user_id: z.string().min(1, '用户ID不能为空'),
  address_name: z.string().min(1, '地址名称不能为空'),
  address: z.string().min(1, '详细地址不能为空'),
  latitude: z.number(),
  longitude: z.number(),
  address_type: z.enum(['home', 'work', 'other']).optional(),
  is_default: z.boolean().optional(),
})

export type CreateAddressDto = z.infer<typeof createAddressSchema>

// 更新地址 DTO
export const updateAddressSchema = z.object({
  address_name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address_type: z.enum(['home', 'work', 'other']).optional(),
  is_default: z.boolean().optional(),
})

export type UpdateAddressDto = z.infer<typeof updateAddressSchema>
