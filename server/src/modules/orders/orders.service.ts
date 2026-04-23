import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateOrderDto } from './dto/orders.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class OrdersService {
  async create(createOrderDto: CreateOrderDto) {
    const { demand_id, vehicle_id, owner_id } = createOrderDto

    const client = getSupabaseClient()

    // 检查需求是否存在
    const { data: demand, error: demandError } = await client
      .from('demands')
      .select('*')
      .eq('id', demand_id)
      .maybeSingle()

    if (demandError || !demand) {
      throw new NotFoundException('需求不存在')
    }

    // 检查需求状态
    if (demand.status !== 'pending') {
      throw new BadRequestException('该需求已被接单或取消')
    }

    // 检查车辆是否存在且可用
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      throw new NotFoundException('车辆不存在')
    }

    if (vehicle.status !== 'active') {
      throw new BadRequestException('车辆不可用')
    }

    // 创建订单
    const { data: order, error: insertError } = await client
      .from('orders')
      .insert({
        demand_id,
        vehicle_id,
        merchant_id: demand.merchant_id,
        owner_id,
        status: 'accepted',
        accept_time: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new BadRequestException(`创建订单失败: ${insertError.message}`)
    }

    // 更新需求状态为已接单
    await client
      .from('demands')
      .update({ status: 'accepted' })
      .eq('id', demand_id)

    return {
      code: 200,
      message: '接单成功',
      data: order
    }
  }

  async findByUserId(ownerId?: string, merchantId?: string, status?: string) {
    const client = getSupabaseClient()

    let query = client.from('orders').select('*')

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    if (merchantId) {
      query = query.eq('merchant_id', merchantId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[OrdersService] 查询订单失败:', error)
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: orders || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()
    const { data: order, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !order) {
      throw new NotFoundException('订单不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: order
    }
  }

  async startTransport(id: string) {
    const client = getSupabaseClient()

    // 检查订单是否存在
    const { data: existingOrder, error: checkError } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingOrder) {
      throw new NotFoundException('订单不存在')
    }

    // 检查订单状态
    if (existingOrder.status !== 'accepted') {
      throw new BadRequestException('只有已接单的订单可以开始运输')
    }

    // 检查需求方是否已确认运费
    if (!existingOrder.merchant_confirmed) {
      throw new BadRequestException('需求方尚未确认运费，无法开始运输')
    }

    // 更新订单状态为运输中
    const { data: order, error: updateError } = await client
      .from('orders')
      .update({
        status: 'in_transit',
        pickup_time: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`开始运输失败: ${updateError.message}`)
    }

    // 更新需求状态为运输中
    await client
      .from('demands')
      .update({ status: 'in_transit' })
      .eq('id', existingOrder.demand_id)

    return {
      code: 200,
      message: '已开始运输',
      data: order
    }
  }

  async complete(id: string, pickupPhotoKey?: string, deliveryPhotoKey?: string) {
    const client = getSupabaseClient()

    // 检查订单是否存在
    const { data: existingOrder, error: checkError } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingOrder) {
      throw new NotFoundException('订单不存在')
    }

    // 检查订单状态
    if (existingOrder.status !== 'in_transit') {
      throw new BadRequestException('只有运输中的订单可以完成')
    }

    // 更新订单状态为已完成
    const { data: order, error: updateError } = await client
      .from('orders')
      .update({
        status: 'completed',
        complete_time: new Date().toISOString(),
        pickup_photo_key: pickupPhotoKey || existingOrder.pickup_photo_key,
        delivery_photo_key: deliveryPhotoKey || existingOrder.delivery_photo_key
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`完成订单失败: ${updateError.message}`)
    }

    // 更新需求状态为已完成
    await client
      .from('demands')
      .update({ status: 'completed' })
      .eq('id', existingOrder.demand_id)

    return {
      code: 200,
      message: '订单已完成',
      data: order
    }
  }

  async confirmFare(orderId: string) {
    const client = getSupabaseClient()

    // 检查订单是否存在
    const { data: order, error: checkError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (checkError || !order) {
      throw new NotFoundException('订单不存在')
    }

    // 检查订单状态
    if (order.status !== 'accepted') {
      throw new BadRequestException('只有已接单的订单可以确认运费')
    }

    // 检查是否已确认
    if (order.merchant_confirmed) {
      throw new BadRequestException('订单已确认运费')
    }

    // 更新订单确认状态
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        merchant_confirmed: true,
        confirm_time: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`确认运费失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '运费已确认',
      data: updatedOrder
    }
  }
}
