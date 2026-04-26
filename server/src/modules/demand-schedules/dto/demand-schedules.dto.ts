import { z } from 'zod'

export const createDemandScheduleSchema = z.object({
  user_id: z.string().uuid(),
  template_id: z.string().uuid(),
  schedule_name: z.string().min(1, '计划名称不能为空').max(100, '计划名称最多100字符'),
  schedule_type: z.enum(['half_day', 'day', 'week', 'month', 'interval']),
  interval_days: z.number().positive().optional(),
  base_date: z.string().min(1, '基准日期不能为空'),
  base_time: z.string().min(1, '基准时间不能为空'),
  pickup_time_offset: z.string().optional(),
  max_publish_count: z.number().positive().optional()
})

export const updateDemandScheduleSchema = z.object({
  schedule_name: z.string().min(1).max(100).optional(),
  schedule_type: z.enum(['half_day', 'day', 'week', 'month', 'interval']).optional(),
  interval_days: z.number().positive().optional(),
  base_date: z.string().min(1).optional(),
  base_time: z.string().min(1).optional(),
  pickup_time_offset: z.string().optional(),
  max_publish_count: z.number().positive().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional()
})

export type CreateDemandScheduleDto = z.infer<typeof createDemandScheduleSchema>
export type UpdateDemandScheduleDto = z.infer<typeof updateDemandScheduleSchema>
