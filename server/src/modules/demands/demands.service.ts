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

  async findByStatus(status: string) {
    const client = getSupabaseClient()

    const { data: demands, error } = await client
      .from('demands')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

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

  async cancel(id: string, reason: string) {
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

    // 检查需求状态
    if (existingDemand.status !== 'pending') {
      throw new BadRequestException('只有待接单的需求可以取消')
    }

    // 更新需求状态为已取消
    const { data: demand, error: updateError } = await client
      .from('demands')
      .update({
        status: 'cancelled',
        remarks: reason || '用户主动取消'
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`取消失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '需求已取消',
      data: demand
    }
  }

  async accept(id: string, ownerId: string, vehicleId: string, farePrice: number, note?: string) {
    const client = getSupabaseClient()

    // 验证车主是否存在
    const { data: owner, error: ownerError } = await client
      .from('users')
      .select('id, role')
      .eq('id', ownerId)
      .maybeSingle()

    if (ownerError || !owner) {
      throw new BadRequestException('车主不存在')
    }

    // 验证用户角色
    if (owner.role !== 'owner') {
      throw new BadRequestException('只有车主可以接单')
    }

    // 检查需求是否存在
    const { data: existingDemand, error: checkError } = await client
      .from('demands')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingDemand) {
      throw new NotFoundException('需求不存在')
    }

    // 检查需求状态
    if (existingDemand.status !== 'pending') {
      throw new BadRequestException('只有待接单的需求可以接单')
    }

    // 验证车辆是否存在且可用
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .maybeSingle()

    if (vehicleError || !vehicle) {
      throw new BadRequestException('所选车辆不存在或不可用')
    }

    // 检查车辆是否已在运输中
    if (vehicle.trip_status === 'in_transit') {
      throw new BadRequestException('该车辆正在运输中，无法接单')
    }

    // 开始事务：更新需求状态、创建订单、更新车辆状态
    const { data: demand, error: updateError } = await client
      .from('demands')
      .update({
        status: 'accepted',
        owner_id: ownerId
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`接单失败: ${updateError.message}`)
    }

    // 创建订单
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        demand_id: id,
        merchant_id: existingDemand.merchant_id,
        owner_id: ownerId,
        vehicle_id: vehicleId,
        status: 'accepted',
        fare_price: farePrice,
        merchant_confirmed: false,
        pickup_time: existingDemand.pickup_time,
        pickup_address: existingDemand.pickup_address,
        delivery_address: existingDemand.delivery_address,
        remarks: note || ''
      })
      .select()
      .single()

    if (orderError) {
      // 如果订单创建失败，回滚需求状态
      await client
        .from('demands')
        .update({ status: 'pending', owner_id: null })
        .eq('id', id)
      throw new BadRequestException(`创建订单失败: ${orderError.message}`)
    }

    // 更新车辆状态为运输中
    const { error: vehicleUpdateError } = await client
      .from('vehicles')
      .update({ trip_status: 'in_transit' })
      .eq('id', vehicleId)

    if (vehicleUpdateError) {
      console.error('[DemandsService] 更新车辆状态失败:', vehicleUpdateError)
      // 不影响接单流程，仅记录日志
    }

    return {
      code: 200,
      message: '接单成功',
      data: {
        demand,
        order
      }
    }
  }

  async getMerchantStats(merchantId: string) {
    const client = getSupabaseClient()

    // 获取所有需求数据
    const { data: demands, error: demandsError } = await client
      .from('demands')
      .select('*')
      .eq('merchant_id', merchantId)

    if (demandsError) {
      throw new BadRequestException(`查询失败: ${demandsError.message}`)
    }

    // 统计各状态数量
    const statusCounts = {
      pending: 0,
      accepted: 0,
      in_transit: 0,
      completed: 0,
      cancelled: 0
    }

    // 统计货品类型
    const cargoTypeCounts = {
      normal: 0,
      fresh: 0,
      fragile: 0
    }

    // 计算总重量和总体积
    let totalWeight = 0
    let totalVolume = 0

    demands.forEach(demand => {
      // 状态统计
      if (demand.status in statusCounts) {
        statusCounts[demand.status as keyof typeof statusCounts]++
      }

      // 货品类型统计
      if (demand.cargo_type in cargoTypeCounts) {
        cargoTypeCounts[demand.cargo_type as keyof typeof cargoTypeCounts]++
      }

      // 重量和体积统计（仅统计已完成的需求）
      if (demand.status === 'completed') {
        totalWeight += demand.weight
        totalVolume += demand.volume
      }
    })

    // 获取最近的需求（最近5条）
    const { data: recentDemands, error: recentError } = await client
      .from('demands')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      throw new BadRequestException(`查询最近需求失败: ${recentError.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: {
        total_demands: demands.length,
        status_counts: statusCounts,
        cargo_type_counts: cargoTypeCounts,
        total_weight: totalWeight,
        total_volume: totalVolume,
        recent_demands: recentDemands || []
      }
    }
  }
}
