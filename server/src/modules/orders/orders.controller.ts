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
    @Query('status') status?: string
  ) {
    return this.ordersService.findByUserId(ownerId, merchantId, status)
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
}
