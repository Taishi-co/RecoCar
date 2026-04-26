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
      max_publish_count
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
    const [hours, minutes] = baseTime.split(':').map(Number)

    const baseDateTime = new Date(`${baseDate}T${baseTime}:00`)

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
