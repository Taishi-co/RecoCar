import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common'
import { CreateDemandDto, UpdateDemandDto } from './dto/demands.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { NotificationsService } from '../notifications/notification.service'

@Injectable()
export class DemandsService {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  // 计算两地距离（使用高德地图API）
  async calculateDistance(params: {
    pickup_lat: number
    pickup_lng: number
    delivery_lat: number
    delivery_lng: number
  }) {
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng } = params

    // 验证参数
    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng) {
      throw new BadRequestException('请提供完整的经纬度坐标')
    }

    try {
      // 调用高德地图驾车路径规划API
      const apiKey = process.env.AMAP_API_KEY || 'demo' // 使用环境变量中的API Key

      const origin = `${pickup_lng},${pickup_lat}`
      const destination = `${delivery_lng},${delivery_lat}`

      const url = `https://restapi.amap.com/v3/direction/driving?origin=${origin}&destination=${destination}&strategy=10&extensions=all&key=${apiKey}`

      console.log('[DemandsService] 调用高德地图API:', url)

      const response = await fetch(url)
      const data = await response.json()

      console.log('[DemandsService] 高德地图API响应:', data)

      // 检查响应状态
      if (data.status !== '1') {
        throw new BadRequestException(`地图API错误: ${data.info}`)
      }

      // 获取路线距离
      if (!data.route || !data.route.paths || data.route.paths.length === 0) {
        throw new BadRequestException('无法获取路线信息')
      }

      const path = data.route.paths[0]
      const distanceMeters = parseInt(path.distance) // 距离（米）
      const durationSeconds = parseInt(path.duration) // 时间（秒）

      // 转换为公里
      const distanceKm = distanceMeters / 1000

      // 计算运费：每公里1元
      const estimatedFare = distanceKm * 1

      return {
        code: 200,
        message: '计算成功',
        data: {
          distance: distanceKm,
          distance_text: `${distanceKm.toFixed(2)}公里`,
          estimated_fare: estimatedFare,
          route_type: 'non_highway',
          route_duration: durationSeconds,
          duration_text: `约${Math.floor(durationSeconds / 60)}分钟`
        }
      }
    } catch (error) {
      console.error('[DemandsService] 距离计算失败:', error)

      // 降级方案：使用直线距离估算
      const straightDistance = this.calculateStraightDistance(pickup_lat, pickup_lng, delivery_lat, delivery_lng)

      // 直线距离 × 1.3 ≈ 实际距离
      const estimatedDistance = straightDistance * 1.3
      const estimatedFare = estimatedDistance * 1

      console.log('[DemandsService] 使用降级方案计算距离:', {
        straight_distance: straightDistance,
        estimated_distance: estimatedDistance,
        estimated_fare: estimatedFare
      })

      return {
        code: 200,
        message: '计算成功（估算）',
        data: {
          distance: estimatedDistance,
          distance_text: `${estimatedDistance.toFixed(2)}公里`,
          estimated_fare: estimatedFare,
          route_type: 'estimated',
          route_duration: Math.floor(estimatedDistance * 60 / 30), // 假设时速30公里
          duration_text: `约${Math.floor(estimatedDistance * 60 / 30)}分钟`,
          is_estimate: true
        }
      }
    }
  }

  // 计算直线距离（Haversine公式）
  private calculateStraightDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // 地球半径，单位：公里
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

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
      remarks,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      estimated_distance,
      estimated_fare
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
        pickup_lat: pickup_lat || null,
        pickup_lng: pickup_lng || null,
        delivery_lat: delivery_lat || null,
        delivery_lng: delivery_lng || null,
        estimated_distance: estimated_distance || null,
        estimated_fare: estimated_fare || null,
        route_type: estimated_distance ? 'non_highway' : null,
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

    // 给需求方发送通知
    try {
      await this.notificationsService.create({
        userId: existingDemand.merchant_id,
        type: 'order_accepted',
        title: '您的需求已被接单',
        content: `您发布的"${existingDemand.cargo_name}"需求已被接单，运费：¥${farePrice.toFixed(2)}，请确认运费后车主将开始运输`,
        relatedOrderId: order.id,
        relatedDemandId: id
      })
    } catch (notificationError) {
      console.error('[DemandsService] 创建通知失败:', notificationError)
      // 通知创建失败不影响接单流程
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
