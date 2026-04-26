import { z } from 'zod'

// 创建地址簿 DTO
export const createAddressBookSchema = z.object({
  user_id: z.string().min(1, '用户ID不能为空'),
  address_type: z.enum(['pickup', 'delivery'], {
    message: '地址类型必须为 pickup/delivery'
  }),
  title: z.string().min(1, '地址标题不能为空').max(100, '地址标题不能超过100字符'),
  address: z.string().min(1, '详细地址不能为空'),
  latitude: z.number().min(-90).max(90, '纬度范围错误'),
  longitude: z.number().min(-180).max(180, '经度范围错误'),
  tag: z.string().max(50, '标签不能超过50字符').optional(),
  is_default: z.boolean().optional().default(false),
})

export type CreateAddressBookDto = z.infer<typeof createAddressBookSchema>

// 更新地址簿 DTO
export const updateAddressBookSchema = z.object({
  title: z.string().min(1, '地址标题不能为空').max(100, '地址标题不能超过100字符').optional(),
  address: z.string().min(1, '详细地址不能为空').optional(),
  latitude: z.number().min(-90).max(90, '纬度范围错误').optional(),
  longitude: z.number().min(-180).max(180, '经度范围错误').optional(),
  tag: z.string().max(50, '标签不能超过50字符').optional(),
  is_default: z.boolean().optional(),
})

export type UpdateAddressBookDto = z.infer<typeof updateAddressBookSchema>

// 查询地址簿 DTO
export const queryAddressBookSchema = z.object({
  user_id: z.string().optional(),
  address_type: z.enum(['pickup', 'delivery']).optional(),
  tag: z.string().optional(),
})

export type QueryAddressBookDto = z.infer<typeof queryAddressBookSchema>
