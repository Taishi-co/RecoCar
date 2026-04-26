import { z } from 'zod'

export const createDemandTemplateSchema = z.object({
  user_id: z.string().uuid(),
  template_name: z.string().min(1, '模板名称不能为空').max(100, '模板名称最多100字符'),
  cargo_name: z.string().min(1, '货品名称不能为空').max(200, '货品名称最多200字符'),
  cargo_type: z.enum(['normal', 'fresh', 'fragile']).default('normal'),
  weight: z.number().positive('重量必须大于0'),
  volume: z.number().positive('体积必须大于0'),
  pickup_address: z.string().min(1, '取货地址不能为空').max(500, '取货地址最多500字符'),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  delivery_address: z.string().min(1, '送货地址不能为空').max(500, '送货地址最多500字符'),
  delivery_lat: z.number().min(-90).max(90),
  delivery_lng: z.number().min(-180).max(180),
  remarks: z.string().max(1000, '备注最多1000字符').optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
  is_default: z.boolean().default(false)
})

export const updateDemandTemplateSchema = z.object({
  template_name: z.string().min(1).max(100).optional(),
  cargo_name: z.string().min(1).max(200).optional(),
  cargo_type: z.enum(['normal', 'fresh', 'fragile']).optional(),
  weight: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  pickup_address: z.string().min(1).max(500).optional(),
  pickup_lat: z.number().min(-90).max(90).optional(),
  pickup_lng: z.number().min(-180).max(180).optional(),
  delivery_address: z.string().min(1).max(500).optional(),
  delivery_lat: z.number().min(-90).max(90).optional(),
  delivery_lng: z.number().min(-180).max(180).optional(),
  remarks: z.string().max(1000).optional(),
  estimated_distance: z.number().optional(),
  estimated_fare: z.number().optional(),
  is_default: z.boolean().optional()
})

export type CreateDemandTemplateDto = z.infer<typeof createDemandTemplateSchema>
export type UpdateDemandTemplateDto = z.infer<typeof updateDemandTemplateSchema>
