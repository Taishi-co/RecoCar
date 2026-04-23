import { Controller, Get, Post, Put, Body, Query, Param } from '@nestjs/common'
import { CancellationsService } from './cancellations.service'

@Controller('cancellations')
export class CancellationsController {
  constructor(private readonly cancellationsService: CancellationsService) {}

  // 需求方申请取消订单
  @Post('request')
  async requestCancel(
    @Body('order_id') orderId: string,
    @Body('reason') reason: string,
    @Body('merchant_id') merchantId: string
  ) {
    console.log('[CancellationsController] 申请取消订单:', orderId, 'reason:', reason)
    return this.cancellationsService.requestCancel(orderId, reason, merchantId)
  }

  // 车主处理取消申请
  @Put(':id/handle')
  async handleRequest(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject',
    @Body('response_reason') responseReason: string,
    @Body('owner_id') ownerId: string
  ) {
    console.log('[CancellationsController] 处理取消申请:', id, 'action:', action)
    return this.cancellationsService.handleRequest(id, action, responseReason, ownerId)
  }

  // 获取待处理的取消申请列表（车主端）
  @Get('pending')
  async getPendingRequests(@Query('owner_id') ownerId: string) {
    return this.cancellationsService.getPendingRequests(ownerId)
  }

  // 获取用户信用积分
  @Get('credit-score')
  async getUserCreditScore(@Query('user_id') userId: string) {
    return this.cancellationsService.getUserCreditScore(userId)
  }
}
