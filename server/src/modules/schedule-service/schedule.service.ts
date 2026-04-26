import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { DemandsService } from '../demands/demands.service'
import { DemandSchedulesService } from '../demand-schedules/demand-schedules.service'
import { DemandTemplatesService } from '../demand-templates/demand-templates.service'

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name)

  constructor(
    private readonly demandsService: DemandsService,
    private readonly demandSchedulesService: DemandSchedulesService,
    private readonly demandTemplatesService: DemandTemplatesService
  ) {}

  // 每分钟检查一次需要发布的计划
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledDemands() {
    try {
      const client = getSupabaseClient()
      const now = new Date()

      // 查询需要发布的计划：next_publish_time <= 当前时间 且 status = 'active'
      const { data: schedules, error } = await client
        .from('demand_schedules')
        .select(`
          *,
          template:template_id (
            id,
            template_name,
            cargo_name,
            cargo_type,
            weight,
            volume,
            pickup_address,
            pickup_lat,
            pickup_lng,
            delivery_address,
            delivery_lat,
            delivery_lng,
            remarks,
            estimated_distance,
            estimated_fare
          )
        `)
        .eq('status', 'active')
        .lte('next_publish_time', now.toISOString())
        .order('next_publish_time', { ascending: true })

      if (error) {
        this.logger.error('查询定时计划失败:', error)
        return
      }

      if (!schedules || schedules.length === 0) {
        return
      }

      this.logger.log(`找到 ${schedules.length} 个需要发布的计划`)

      // 处理每个计划
      for (const schedule of schedules) {
        await this.publishDemand(schedule)
      }
    } catch (error) {
      this.logger.error('处理定时需求失败:', error)
    }
  }

  async publishDemand(schedule: any) {
    const client = getSupabaseClient()
    const { template, schedule_type, interval_days, base_time, pickup_time_offset, max_publish_count, published_count } = schedule

    try {
      this.logger.log(`开始发布需求 - 计划ID: ${schedule.id}, 模板: ${template.template_name}`)

      // 计算取货时间（基准时间 + 偏移）
      const baseDateTime = new Date(schedule.next_publish_time)
      const pickupTime = new Date(baseDateTime)

      if (pickup_time_offset) {
        const offsetMatch = pickup_time_offset.match(/([+-])(\d+):(\d+):(\d+)/)
        if (offsetMatch) {
          const [, sign, hours, minutes, seconds] = offsetMatch
          const totalSeconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds)
          const offsetMs = sign === '+' ? totalSeconds * 1000 : -totalSeconds * 1000
          pickupTime.setTime(pickupTime.getTime() + offsetMs)
        }
      }

      // 创建需求数据
      const demandData = {
        merchant_id: schedule.user_id,
        cargo_name: template.cargo_name,
        cargo_type: template.cargo_type,
        weight: template.weight,
        volume: template.volume,
        pickup_time: pickupTime.toISOString().slice(0, 19).replace('T', ' '),
        pickup_address: template.pickup_address,
        pickup_location: JSON.stringify({
          latitude: template.pickup_lat,
          longitude: template.pickup_lng
        }),
        delivery_address: template.delivery_address,
        delivery_location: JSON.stringify({
          latitude: template.delivery_lat,
          longitude: template.delivery_lng
        }),
        remarks: template.remarks,
        pickup_lat: template.pickup_lat,
        pickup_lng: template.pickup_lng,
        delivery_lat: template.delivery_lat,
        delivery_lng: template.delivery_lng,
        estimated_distance: template.estimated_distance,
        estimated_fare: template.estimated_fare,
        template_id: template.id,
        is_from_schedule: true,
        schedule_id: schedule.id
      }

      // 创建需求
      const { data: demand, error: demandError } = await client
        .from('demands')
        .insert(demandData)
        .select()
        .single()

      if (demandError) {
        throw new Error(`创建需求失败: ${demandError.message}`)
      }

      // 增加模板使用次数
      await this.demandTemplatesService.incrementUseCount(template.id)

      // 计算下次发布时间
      const nextPublishTime = this.demandSchedulesService.calculateNextPublishTime(
        schedule.next_publish_time,
        schedule_type,
        interval_days
      )

      // 检查是否达到最大发布次数
      const newPublishedCount = published_count + 1
      let newStatus = 'active'

      if (max_publish_count && newPublishedCount >= max_publish_count) {
        newStatus = 'completed'
        this.logger.log(`计划 ${schedule.id} 已达到最大发布次数，状态更新为已完成`)
      }

      // 更新计划
      const { error: updateError } = await client
        .from('demand_schedules')
        .update({
          published_count: newPublishedCount,
          next_publish_time: newStatus === 'completed' ? null : nextPublishTime,
          last_published_at: new Date().toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id)

      if (updateError) {
        throw new Error(`更新计划失败: ${updateError.message}`)
      }

      // 记录发布日志
      await client
        .from('demand_publish_logs')
        .insert({
          schedule_id: schedule.id,
          demand_id: demand.id,
          publish_time: new Date().toISOString(),
          status: 'success'
        })

      this.logger.log(`需求发布成功 - 需求ID: ${demand.id}, 计划ID: ${schedule.id}`)
    } catch (error) {
      this.logger.error(`发布需求失败 - 计划ID: ${schedule.id}:`, error)

      // 记录失败日志
      await client
        .from('demand_publish_logs')
        .insert({
          schedule_id: schedule.id,
          demand_id: null,
          publish_time: new Date().toISOString(),
          status: 'failed',
          error_message: error.message
        })
    }
  }
}
