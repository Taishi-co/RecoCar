import { z } from 'zod'

// 更新平台配置 DTO
export const updateSettingsSchema = z.object({
  commissionRate: z.number().min(0).max(100).optional(),
  commissionPaymentQr: z.string().optional()
})

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>
