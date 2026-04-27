import { z } from 'zod'

// 创建租赁关系 DTO
export const createRentalSchema = z.object({
  vehicle_id: z.string().min(1, '车辆ID不能为空'),
  owner_id: z.string().min(1, '车主ID不能为空'),
  rent_type: z.enum(['monthly', 'yearly']),
  rent_start_date: z.string().datetime('开始日期格式不正确'),
  rent_end_date: z.string().datetime('结束日期格式不正确'),
  contract_signed: z.boolean().default(false),
  rent_paid: z.boolean().default(false),
  deposit_paid: z.boolean().default(false),
  deposit_amount: z.number().min(0).default(0),
  notes: z.string().optional()
})

export type CreateRentalDto = z.infer<typeof createRentalSchema>

// 确认租赁 DTO
export const confirmRentalSchema = z.object({
  confirm: z.boolean(),
  notes: z.string().optional()
})

export type ConfirmRentalDto = z.infer<typeof confirmRentalSchema>

// 确认归还 DTO
export const confirmReturnSchema = z.object({
  notes: z.string().optional()
})

export type ConfirmReturnDto = z.infer<typeof confirmReturnSchema>
