import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateDemandScheduleDto, UpdateDemandScheduleDto } from './dto/demand-schedules.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class DemandSchedulesService {
  async create(createDto: CreateDemandScheduleDto) {
    const {
      user_id,
      template_id,
      schedule_name,
      schedule_type,
      interval_days,
      base_date,
      base_time,
      pickup_time_offset,
      max_publish_count,
      end_time
    } = createDto

    const client = getSupabaseClient()

    // 验证模板是否存在
    const { data: template, error: templateError } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      throw new NotFoundException('模板不存在')
    }

    // 验证模板归属
    if (template.user_id !== user_id) {
      throw new BadRequestException('无权使用该模板')
    }

    // 验证 interval_days（仅 interval 类型需要）
    if (schedule_type === 'interval' && !interval_days) {
      throw new BadRequestException('interval_days 参数不能为空')
    }

    // 计算首次发布时间
    const firstPublishTime = this.calculateFirstPublishTime(base_date, base_time)

    const { data: schedule, error: insertError } = await client
      .from('demand_schedules')
      .insert({
        user_id,
        template_id,
        schedule_name,
        schedule_type,
        interval_days: interval_days || null,
        base_date,
        base_time,
        pickup_time_offset: pickup_time_offset || null,
        max_publish_count: max_publish_count || null,
        end_time: end_time || null,
        published_count: 0,
        status: 'active',
        next_publish_time: firstPublishTime,
        last_published_at: null
      })
      .select()
      .single()

    if (insertError) {
      console.error('[DemandSchedulesService] 创建计划失败:', insertError)
      throw new BadRequestException('创建计划失败')
    }

    return {
      code: 200,
      message: '计划创建成功',
      data: schedule
    }
  }

  async findByUserId(userId: string) {
    const client = getSupabaseClient()

    const { data: schedules, error } = await client
      .from('demand_schedules')
      .select(`
        *,
        template:template_id (
          template_name,
          cargo_name,
          pickup_address,
          delivery_address
        )
      `)
      .eq('user_id', userId)
      .order('next_publish_time', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DemandSchedulesService] 查询计划列表失败:', error)
      throw new BadRequestException('查询计划列表失败')
    }

    return {
      code: 200,
      message: '查询成功',
      data: schedules || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: schedule, error } = await client
      .from('demand_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !schedule) {
      throw new NotFoundException('计划不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: schedule
    }
  }

  async update(id: string, updateDto: UpdateDemandScheduleDto) {
    const client = getSupabaseClient()

    // 先查询计划是否存在
    const { data: existingSchedule, error: queryError } = await client
      .from('demand_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingSchedule) {
      throw new NotFoundException('计划不存在')
    }

    // 如果修改了关键参数，重新计算下次发布时间
    const updateData: any = { ...updateDto, updated_at: new Date().toISOString() }

    if (updateDto.base_date || updateDto.base_time || updateDto.schedule_type || updateDto.interval_days) {
      const baseDate = updateDto.base_date || existingSchedule.base_date
      const baseTime = updateDto.base_time || existingSchedule.base_time
      const scheduleType = updateDto.schedule_type || existingSchedule.schedule_type
      const intervalDays = updateDto.interval_days || existingSchedule.interval_days

      updateData.next_publish_time = this.calculateFirstPublishTime(baseDate, baseTime, scheduleType, intervalDays)
    }

    const { data: schedule, error: updateError } = await client
      .from('demand_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[DemandSchedulesService] 更新计划失败:', updateError)
      throw new BadRequestException('更新计划失败')
    }

    return {
      code: 200,
      message: '计划更新成功',
      data: schedule
    }
  }

  async pause(id: string) {
    const client = getSupabaseClient()

    const { data: schedule, error } = await client
      .from('demand_schedules')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[DemandSchedulesService] 暂停计划失败:', error)
      throw new BadRequestException('暂停计划失败')
    }

    return {
      code: 200,
      message: '计划已暂停',
      data: schedule
    }
  }

  async resume(id: string) {
    const client = getSupabaseClient()

    const { data: schedule, error } = await client
      .from('demand_schedules')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[DemandSchedulesService] 恢复计划失败:', error)
      throw new BadRequestException('恢复计划失败')
    }

    return {
      code: 200,
      message: '计划已恢复',
      data: schedule
    }
  }

  async delete(id: string) {
    const client = getSupabaseClient()

    // 先查询计划是否存在
    const { data: existingSchedule, error: queryError } = await client
      .from('demand_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingSchedule) {
      throw new NotFoundException('计划不存在')
    }

    // 如果计划正在运行，不能删除，只能取消
    if (existingSchedule.status === 'active') {
      throw new BadRequestException('正在运行的计划不能删除，请先暂停或取消')
    }

    const { error: deleteError } = await client
      .from('demand_schedules')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[DemandSchedulesService] 删除计划失败:', deleteError)
      throw new BadRequestException('删除计划失败')
    }

    return {
      code: 200,
      message: '计划删除成功',
      data: null
    }
  }

  async publishNow(id: string, currentUserId: string) {
    const client = getSupabaseClient()

    // 1. 查询定时计划
    const { data: schedule, error: scheduleError } = await client
      .from('demand_schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (scheduleError || !schedule) {
      throw new NotFoundException('定时计划不存在')
    }

    // 2. 验证权限
    if (schedule.user_id !== currentUserId) {
      throw new BadRequestException('无权操作该定时计划')
    }

    // 3. 检查状态
    if (schedule.status === 'cancelled') {
      throw new BadRequestException('该计划已取消，无法发布')
    }

    // 4. 获取关联的模板
    const { data: template, error: templateError } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', schedule.template_id)
      .single()

    if (templateError || !template) {
      throw new BadRequestException('关联的模板不存在或已被删除')
    }

    // 5. 计算取货时间（当前时间 + 偏移量）
    const publishTime = new Date()
    const pickupTime = schedule.pickup_time_offset
      ? new Date(publishTime.getTime() + this.parseOffsetToMilliseconds(schedule.pickup_time_offset))
      : publishTime

    // 6. 创建需求
    const { data: demand, error: demandError } = await client
      .from('demands')
      .insert({
        merchant_id: schedule.user_id,
        owner_id: schedule.user_id,
        template_id: template.id,
        cargo_name: template.cargo_name,
        cargo_type: template.cargo_type,
        weight: template.weight,
        volume: template.volume,
        pickup_address: template.pickup_address,
        pickup_lat: template.pickup_lat,
        pickup_lng: template.pickup_lng,
        pickup_time: pickupTime.toISOString(),
        delivery_address: template.delivery_address,
        delivery_lat: template.delivery_lat,
        delivery_lng: template.delivery_lng,
        remarks: template.remarks,
        status: 'pending',
        is_from_schedule: true,
        schedule_id: schedule.id,
        created_at: publishTime.toISOString(),
        updated_at: publishTime.toISOString()
      })
      .select()
      .single()

    if (demandError) {
      console.error('[DemandSchedulesService] 创建需求失败:', demandError)
      throw new BadRequestException('创建需求失败')
    }

    // 8. 更新模板使用次数
    await client
      .from('demand_templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', template.id)

    // 9. 更新定时计划
    await client
      .from('demand_schedules')
      .update({
        published_count: schedule.published_count + 1,
        last_published_at: publishTime.toISOString(),
        // next_publish_time 保持不变，不影响定时任务
        updated_at: publishTime.toISOString()
      })
      .eq('id', schedule.id)

    // 10. 记录发布日志
    await client
      .from('demand_publish_logs')
      .insert({
        schedule_id: schedule.id,
        demand_id: demand.id,
        publish_time: publishTime.toISOString(),
        publish_type: 'manual',
        status: 'success',
        created_at: publishTime.toISOString()
      })

    return {
      code: 200,
      message: '需求发布成功',
      data: {
        demand_id: demand.id,
        schedule_id: schedule.id,
        published_at: publishTime.toISOString(),
        demand_info: {
          cargo_name: demand.cargo_name,
          pickup_address: demand.pickup_address,
          delivery_address: demand.delivery_address,
          pickup_time: demand.pickup_time
        }
      }
    }
  }

  // 解析偏移量字符串为毫秒（例如："2h" -> 7200000, "30m" -> 1800000）
  private parseOffsetToMilliseconds(offset: string): number {
    const match = offset.match(/^(\d+)([hm])$/)
    if (!match) return 0

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000
      case 'm':
        return value * 60 * 1000
      default:
        return 0
    }
  }

  async getLogs(scheduleId: string) {
    const client = getSupabaseClient()

    const { data: logs, error } = await client
      .from('demand_publish_logs')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('publish_time', { ascending: false })

    if (error) {
      console.error('[DemandSchedulesService] 查询发布日志失败:', error)
      throw new BadRequestException('查询发布日志失败')
    }

    return {
      code: 200,
      message: '查询成功',
      data: logs || []
    }
  }

  // 计算首次发布时间
  private calculateFirstPublishTime(
    baseDate: string,
    baseTime: string,
    scheduleType: string = 'day',
    intervalDays: number = 1
  ): string {
    const now = new Date()

    // baseTime 可能是 "HH:mm" 或 "HH:mm:ss" 格式，统一处理
    const timeParts = baseTime.split(':').map(Number)
    const hours = timeParts[0]
    const minutes = timeParts[1]

    // 构建日期时间字符串，baseDate 是 YYYY-MM-DD，baseTime 是 HH:mm:ss
    const baseDateTime = new Date(`${baseDate}T${baseTime}`)

    // 检查日期是否有效
    if (isNaN(baseDateTime.getTime())) {
      throw new BadRequestException('无效的日期时间格式')
    }

    // 如果基准时间已经过去，则计算下一个周期
    if (baseDateTime <= now) {
      switch (scheduleType) {
        case 'half_day':
          baseDateTime.setHours(baseDateTime.getHours() + 12)
          break
        case 'day':
          baseDateTime.setDate(baseDateTime.getDate() + 1)
          break
        case 'week':
          baseDateTime.setDate(baseDateTime.getDate() + 7)
          break
        case 'month':
          baseDateTime.setMonth(baseDateTime.getMonth() + 1)
          break
        case 'interval':
          baseDateTime.setDate(baseDateTime.getDate() + intervalDays)
          break
      }
    }

    return baseDateTime.toISOString()
  }

  // 计算下次发布时间
  calculateNextPublishTime(
    lastPublishedTime: string,
    scheduleType: string,
    intervalDays?: number
  ): string {
    const lastTime = new Date(lastPublishedTime)
    const nextTime = new Date(lastTime)

    switch (scheduleType) {
      case 'half_day':
        nextTime.setHours(nextTime.getHours() + 12)
        break
      case 'day':
        nextTime.setDate(nextTime.getDate() + 1)
        break
      case 'week':
        nextTime.setDate(nextTime.getDate() + 7)
        break
      case 'month':
        nextTime.setMonth(nextTime.getMonth() + 1)
        break
      case 'interval':
        nextTime.setDate(nextTime.getDate() + (intervalDays || 1))
        break
    }

    return nextTime.toISOString()
  }
}
