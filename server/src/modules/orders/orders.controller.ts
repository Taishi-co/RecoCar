import { Controller, Post, Get, Put, Body, Query, Param } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/orders.dto'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    console.log('[OrdersController] 创建订单请求:', createOrderDto)
    return this.ordersService.create(createOrderDto)
  }

  @Get()
  async getOrders(
    @Query('owner_id') ownerId?: string,
    @Query('merchant_id') merchantId?: string,
    @Query('status') status?: string,
    @Query('commission_payment_status') commissionPaymentStatus?: string
  ) {
    return this.ordersService.findByUserId(ownerId, merchantId, status, commissionPaymentStatus)
  }

  // 获取运力方收益统计 - 必须放在 :id 路由之前
  @Get('owner-revenue/:ownerId')
  async getOwnerRevenueStats(@Param('ownerId') ownerId: string) {
    console.log('[OrdersController] 获取运力方收益统计:', ownerId)
    return this.ordersService.getOwnerRevenueStats(ownerId)
  }

  // 获取平台佣金汇总统计 - 必须放在 :id 路由之前
  @Get('commission-summary')
  async getCommissionSummary() {
    console.log('[OrdersController] 获取平台佣金汇总统计')
    return this.ordersService.getCommissionSummary()
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findById(id)
  }

  @Post(':id/start-transport')
  async startTransport(@Param('id') id: string) {
    console.log('[OrdersController] 开始运输请求:', id)
    return this.ordersService.startTransport(id)
  }

  @Put(':id/complete')
  async completeOrder(
    @Param('id') id: string,
    @Body('pickup_photo_key') pickupPhotoKey?: string,
    @Body('delivery_photo_key') deliveryPhotoKey?: string
  ) {
    console.log('[OrdersController] 完成订单请求:', id, pickupPhotoKey, deliveryPhotoKey)
    return this.ordersService.complete(id, pickupPhotoKey, deliveryPhotoKey)
  }

  @Post(':id/confirm-fare')
  async confirmFare(@Param('id') id: string) {
    console.log('[OrdersController] 确认运费请求:', id)
    return this.ordersService.confirmFare(id)
  }

  // 需求方标记已付款
  @Put(':id/payment-marked')
  async markPayment(@Param('id') id: string) {
    console.log('[OrdersController] 需求方标记已付款:', id)
    return this.ordersService.markPayment(id)
  }

  // 运力方确认收款
  @Put(':id/payment-confirm')
  async confirmPayment(@Param('id') id: string) {
    console.log('[OrdersController] 运力方确认收款:', id)
    return this.ordersService.confirmPayment(id)
  }

  // 获取付款信息
  @Get(':id/payment-info')
  async getPaymentInfo(@Param('id') id: string) {
    return this.ordersService.getPaymentInfo(id)
  }

  // 运力方标记已付佣金
  @Put(':id/commission-payment-marked')
  async markCommissionPayment(
    @Param('id') id: string,
    @Body('payment_proof') paymentProof?: string
  ) {
    console.log('[OrdersController] 运力方标记已付佣金:', id)
    return this.ordersService.markCommissionPayment(id, paymentProof)
  }

  // 获取佣金支付信息
  @Get(':id/commission-info')
  async getCommissionInfo(@Param('id') id: string) {
    return this.ordersService.getCommissionInfo(id)
  }

  // 管理员确认佣金支付
  @Put(':id/commission-confirm')
  async confirmCommission(@Param('id') id: string) {
    console.log('[OrdersController] 管理员确认佣金:', id)
    return this.ordersService.confirmCommission(id)
  }
}
