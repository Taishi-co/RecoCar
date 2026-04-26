import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateDemandTemplateDto, UpdateDemandTemplateDto } from './dto/demand-templates.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class DemandTemplatesService {
  async create(createDto: CreateDemandTemplateDto) {
    const {
      user_id,
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
      estimated_fare,
      is_default
    } = createDto

    const client = getSupabaseClient()

    // 如果设置为默认模板，先将该用户的其他模板取消默认
    if (is_default) {
      await client
        .from('demand_templates')
        .update({ is_default: false })
        .eq('user_id', user_id)
    }

    const { data: template, error: insertError } = await client
      .from('demand_templates')
      .insert({
        user_id,
        template_name,
        cargo_name,
        cargo_type: cargo_type || 'normal',
        weight,
        volume,
        pickup_address,
        pickup_lat,
        pickup_lng,
        delivery_address,
        delivery_lat,
        delivery_lng,
        remarks: remarks || null,
        estimated_distance: estimated_distance || null,
        estimated_fare: estimated_fare || null,
        use_count: 0,
        is_default: is_default || false
      })
      .select()
      .single()

    if (insertError) {
      console.error('[DemandTemplatesService] 创建模板失败:', insertError)
      throw new BadRequestException('创建模板失败')
    }

    return {
      code: 200,
      message: '模板创建成功',
      data: template
    }
  }

  async findByUserId(userId: string) {
    const client = getSupabaseClient()

    const { data: templates, error } = await client
      .from('demand_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DemandTemplatesService] 查询模板列表失败:', error)
      throw new BadRequestException('查询模板列表失败')
    }

    return {
      code: 200,
      message: '查询成功',
      data: templates || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: template, error } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !template) {
      throw new NotFoundException('模板不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: template
    }
  }

  async update(id: string, updateDto: UpdateDemandTemplateDto) {
    const client = getSupabaseClient()

    // 先查询模板是否存在
    const { data: existingTemplate, error: queryError } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingTemplate) {
      throw new NotFoundException('模板不存在')
    }

    // 如果设置为默认模板，先将该用户的其他模板取消默认
    if (updateDto.is_default) {
      await client
        .from('demand_templates')
        .update({ is_default: false })
        .eq('user_id', existingTemplate.user_id)
        .neq('id', id)
    }

    const { data: template, error: updateError } = await client
      .from('demand_templates')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[DemandTemplatesService] 更新模板失败:', updateError)
      throw new BadRequestException('更新模板失败')
    }

    // 同步更新引用该模板的定时计划
    // 如果模板名称发生变化，更新定时计划的 schedule_name
    if (updateDto.template_name && updateDto.template_name !== existingTemplate.template_name) {
      console.log(`[DemandTemplatesService] 模板名称变更: ${existingTemplate.template_name} -> ${updateDto.template_name}，开始更新关联的定时计划`)

      const { data: schedules, error: schedulesError } = await client
        .from('demand_schedules')
        .select('id, schedule_name')
        .eq('template_id', id)

      if (!schedulesError && schedules && schedules.length > 0) {
        // 更新定时计划的 schedule_name，将模板名称替换
        for (const schedule of schedules) {
          // 如果定时计划名称与模板名称相同，则更新为新的模板名称
          // 否则不修改（因为用户可能自定义了计划名称）
          if (schedule.schedule_name === existingTemplate.template_name) {
            await client
              .from('demand_schedules')
              .update({
                schedule_name: updateDto.template_name,
                updated_at: new Date().toISOString()
              })
              .eq('id', schedule.id)

            console.log(`[DemandTemplatesService] 更新定时计划 ${schedule.id} 的名称`)
          }
        }
      }
    }

    return {
      code: 200,
      message: '模板更新成功',
      data: template
    }
  }

  async delete(id: string) {
    const client = getSupabaseClient()

    // 先查询模板是否存在
    const { data: existingTemplate, error: queryError } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingTemplate) {
      throw new NotFoundException('模板不存在')
    }

    // 查找并删除所有关联的定时计划
    const { data: schedules, error: schedulesError } = await client
      .from('demand_schedules')
      .select('id, schedule_name, status')
      .eq('template_id', id)

    if (!schedulesError && schedules && schedules.length > 0) {
      console.log(`[DemandTemplatesService] 删除模板 ${id}，同时删除 ${schedules.length} 个关联的定时计划`)

      // 先暂停所有关联的定时计划
      for (const schedule of schedules) {
        if (schedule.status === 'active') {
          await client
            .from('demand_schedules')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', schedule.id)

          console.log(`[DemandTemplatesService] 暂停定时计划 ${schedule.id} (${schedule.schedule_name})`)
        }
      }

      // 删除所有关联的定时计划
      const { error: deleteSchedulesError } = await client
        .from('demand_schedules')
        .delete()
        .eq('template_id', id)

      if (deleteSchedulesError) {
        console.error('[DemandTemplatesService] 删除关联定时计划失败:', deleteSchedulesError)
        throw new BadRequestException('删除关联定时计划失败')
      }
    }

    // 删除模板
    const { error: deleteError } = await client
      .from('demand_templates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[DemandTemplatesService] 删除模板失败:', deleteError)
      throw new BadRequestException('删除模板失败')
    }

    return {
      code: 200,
      message: `模板删除成功${schedules && schedules.length > 0 ? `，同时删除了 ${schedules.length} 个定时计划` : ''}`,
      data: null
    }
  }

  async setDefault(id: string) {
    const client = getSupabaseClient()

    // 先查询模板是否存在
    const { data: existingTemplate, error: queryError } = await client
      .from('demand_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingTemplate) {
      throw new NotFoundException('模板不存在')
    }

    // 将该用户的其他模板取消默认
    await client
      .from('demand_templates')
      .update({ is_default: false })
      .eq('user_id', existingTemplate.user_id)
      .neq('id', id)

    // 设置当前模板为默认
    const { data: template, error: updateError } = await client
      .from('demand_templates')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[DemandTemplatesService] 设置默认模板失败:', updateError)
      throw new BadRequestException('设置默认模板失败')
    }

    return {
      code: 200,
      message: '设置成功',
      data: template
    }
  }

  async incrementUseCount(id: string) {
    const client = getSupabaseClient()

    // 先获取当前 use_count
    const { data: template, error: queryError } = await client
      .from('demand_templates')
      .select('use_count')
      .eq('id', id)
      .single()

    if (queryError || !template) {
      console.error('[DemandTemplatesService] 查询模板失败:', queryError)
      return null
    }

    // 更新 use_count
    const { data: updatedTemplate, error } = await client
      .from('demand_templates')
      .update({ use_count: template.use_count + 1, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[DemandTemplatesService] 增加使用次数失败:', error)
      return null
    }

    return updatedTemplate
  }
}
