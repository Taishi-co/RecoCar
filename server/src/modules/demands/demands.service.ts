import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateDemandDto, UpdateDemandDto } from './dto/demands.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class DemandsService {
  async create(createDemandDto: CreateDemandDto) {
    const {
      merchant_id,
      cargo_name,
      cargo_type,
      weight,
      volume,
      pickup_time,
      pickup_address,
      pickup_location,
      delivery_address,
      delivery_location,
      remarks
    } = createDemandDto

    // 验证用户是否存在
    const client = getSupabaseClient()
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('id', merchant_id)
      .maybeSingle()

    if (userError || !user) {
      throw new BadRequestException('用户不存在')
    }

    // 验证用户角色
    if (user.role !== 'merchant') {
      throw new BadRequestException('只有需求方可以发布需求')
    }

    // 创建需求记录
    const { data: demand, error: insertError } = await client
      .from('demands')
      .insert({
        merchant_id,
        cargo_name,
        cargo_type,
        weight: parseFloat(weight),
        volume: parseFloat(volume),
        pickup_time,
        pickup_address,
        pickup_location: pickup_location ? JSON.parse(pickup_location) : null,
        delivery_address,
        delivery_location: delivery_location ? JSON.parse(delivery_location) : null,
        remarks,
        status: 'pending', // 默认待接单
      })
      .select()
      .single()

    if (insertError) {
      throw new BadRequestException(`创建需求失败: ${insertError.message}`)
    }

    return {
      code: 200,
      message: '需求发布成功',
      data: demand
    }
  }

  async findByMerchantId(merchantId?: string) {
    const client = getSupabaseClient()

    let query = client.from('demands').select('*')

    if (merchantId) {
      query = query.eq('merchant_id', merchantId)
    }

    const { data: demands, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: demands || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()
    const { data: demand, error } = await client
      .from('demands')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !demand) {
      throw new NotFoundException('需求不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: demand
    }
  }

  async update(id: string, updateDemandDto: UpdateDemandDto) {
    const client = getSupabaseClient()

    // 检查需求是否存在
    const { data: existingDemand, error: checkError } = await client
      .from('demands')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingDemand) {
      throw new NotFoundException('需求不存在')
    }

    // 更新需求信息
    const updateData: any = {
      cargo_name: updateDemandDto.cargo_name,
      cargo_type: updateDemandDto.cargo_type,
      weight: updateDemandDto.weight ? parseFloat(updateDemandDto.weight) : existingDemand.weight,
      volume: updateDemandDto.volume ? parseFloat(updateDemandDto.volume) : existingDemand.volume,
      pickup_time: updateDemandDto.pickup_time,
      pickup_address: updateDemandDto.pickup_address,
      pickup_location: updateDemandDto.pickup_location ? JSON.parse(updateDemandDto.pickup_location) : existingDemand.pickup_location,
      delivery_address: updateDemandDto.delivery_address,
      delivery_location: updateDemandDto.delivery_location ? JSON.parse(updateDemandDto.delivery_location) : existingDemand.delivery_location,
      remarks: updateDemandDto.remarks,
    }

    const { data: demand, error: updateError } = await client
      .from('demands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '更新成功',
      data: demand
    }
  }
}
