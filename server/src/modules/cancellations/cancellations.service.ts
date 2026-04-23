import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { NotificationsService } from '../notifications/notification.service'

@Injectable()
export class CancellationsService {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  // 需求方申请取消订单
  async requestCancel(orderId: string, reason: string, merchantId: string) {
    const client = getSupabaseClient()

    // 检查订单是否存在
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      throw new NotFoundException('订单不存在')
    }

    // 检查是否是需求方的订单
    if (order.merchant_id !== merchantId) {
      throw new BadRequestException('无权操作此订单')
    }

    // 检查订单状态
    if (!order.merchant_confirmed) {
      throw new BadRequestException('运费未确认，无需申请取消，可以直接取消')
    }

    if (order.status !== 'accepted') {
      throw new BadRequestException('只有已接单且运费已确认的订单可以申请取消')
    }

    // 检查是否已有待处理的取消申请
    const { data: existingRequest } = await client
      .from('cancellation_requests')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      throw new BadRequestException('已有待处理的取消申请')
    }

    // 创建取消申请
    const { data: request, error: createError } = await client
      .from('cancellation_requests')
      .insert({
        order_id: orderId,
        requestor_id: merchantId,
        responder_id: order.owner_id,
        reason: reason,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      throw new BadRequestException(`创建取消申请失败: ${createError.message}`)
    }

    // 给车主发送通知
    try {
      await this.notificationsService.create({
        userId: order.owner_id,
        type: 'cancellation_requested',
        title: '订单取消申请',
        content: `需求方申请取消订单，原因：${reason}`,
        relatedOrderId: order.id,
        relatedDemandId: order.demand_id
      })
    } catch (notificationError) {
      console.error('[CancellationsService] 创建通知失败:', notificationError)
    }

    return {
      code: 200,
      message: '取消申请已提交，等待车主处理',
      data: request
    }
  }

  // 车主处理取消申请（同意或拒绝）
  async handleRequest(
    requestId: string,
    action: 'approve' | 'reject',
    responseReason: string,
    ownerId: string
  ) {
    const client = getSupabaseClient()

    // 检查取消申请是否存在
    const { data: request, error: requestError } = await client
      .from('cancellation_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (requestError || !request) {
      throw new NotFoundException('取消申请不存在')
    }

    // 检查是否是车主处理
    if (request.responder_id !== ownerId) {
      throw new BadRequestException('无权处理此申请')
    }

    // 检查申请状态
    if (request.status !== 'pending') {
      throw new BadRequestException('该申请已被处理')
    }

    // 获取订单信息
    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', request.order_id)
      .single()

    if (action === 'approve') {
      // 同意取消
      // 扣除需求方信用积分10分
      const { data: user } = await client
        .from('users')
        .select('credit_score')
        .eq('id', request.requestor_id)
        .single()

      const currentScore = user?.credit_score || 100
      const newScore = Math.max(0, currentScore - 10)

      await client
        .from('users')
        .update({
          credit_score: newScore
        })
        .eq('id', request.requestor_id)

      // 更新取消申请状态
      await client
        .from('cancellation_requests')
        .update({
          status: 'approved',
          response_reason: responseReason,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      // 更新订单状态为已取消
      await client
        .from('orders')
        .update({
          status: 'cancelled',
          cancel_reason: `双方协商取消：${request.reason}`,
          cancel_time: new Date().toISOString()
        })
        .eq('id', request.order_id)

      // 更新需求状态为待接单
      await client
        .from('demands')
        .update({
          status: 'pending',
          owner_id: null
        })
        .eq('id', order.demand_id)

      // 恢复车辆状态为空闲
      if (order.vehicle_id) {
        await client
          .from('vehicles')
          .update({ trip_status: 'idle' })
          .eq('id', order.vehicle_id)
      }

      // 给需求方发送通知
      try {
        await this.notificationsService.create({
          userId: request.requestor_id,
          type: 'cancellation_approved',
          title: '取消申请已同意',
          content: `车主同意了您的取消申请，已扣除10分信用积分`,
          relatedOrderId: order.id,
          relatedDemandId: order.demand_id
        })
      } catch (notificationError) {
        console.error('[CancellationsService] 创建通知失败:', notificationError)
      }

      return {
        code: 200,
        message: '已同意取消，需求方信用积分已扣除10分',
        data: null
      }
    } else {
      // 拒绝取消
      await client
        .from('cancellation_requests')
        .update({
          status: 'rejected',
          response_reason: responseReason,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      // 给需求方发送通知
      try {
        await this.notificationsService.create({
          userId: request.requestor_id,
          type: 'cancellation_rejected',
          title: '取消申请已拒绝',
          content: `车主拒绝了您的取消申请，原因：${responseReason}`,
          relatedOrderId: order.id,
          relatedDemandId: order.demand_id
        })
      } catch (notificationError) {
        console.error('[CancellationsService] 创建通知失败:', notificationError)
      }

      return {
        code: 200,
        message: '已拒绝取消申请',
        data: null
      }
    }
  }

  // 获取待处理的取消申请列表（车主端）
  async getPendingRequests(ownerId: string) {
    const client = getSupabaseClient()

    // 先查询待处理的取消申请
    const { data: requests, error } = await client
      .from('cancellation_requests')
      .select('*')
      .eq('responder_id', ownerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    if (!requests || requests.length === 0) {
      return {
        code: 200,
        message: '查询成功',
        data: []
      }
    }

    // 获取所有相关的订单ID和需求ID
    const orderIds = requests.map(r => r.order_id)
    const demandIds = requests.map(r => {
      // 从 order_id 反查 demand_id
      return null // 将在下面查询订单后获取
    })

    // 查询订单信息
    const { data: orders } = await client
      .from('orders')
      .select('id, demand_id, fare_price, merchant_confirmed')
      .in('id', orderIds)

    // 查询需求信息
    const demandIdsFromOrders = orders?.map(o => o.demand_id) || []
    const { data: demands } = await client
      .from('demands')
      .select('id, cargo_name, pickup_address, delivery_address')
      .in('id', demandIdsFromOrders)

    // 组合数据
    const enrichedRequests = requests.map(request => {
      const order = orders?.find(o => o.id === request.order_id)
      const demand = demands?.find(d => d.id === order?.demand_id)
      return {
        ...request,
        orders: order || {},
        demands: demand || {}
      }
    })

    return {
      code: 200,
      message: '查询成功',
      data: enrichedRequests
    }
  }

  // 获取用户信用积分
  async getUserCreditScore(userId: string) {
    const client = getSupabaseClient()

    const { data: user, error } = await client
      .from('users')
      .select('credit_score')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) {
      throw new NotFoundException('用户不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: { credit_score: user.credit_score || 100 }
    }
  }
}
