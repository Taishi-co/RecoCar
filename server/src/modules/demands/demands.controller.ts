import { Controller, Post, Get, Put, Body, Query, Req, Param } from '@nestjs/common'
import { DemandsService } from './demands.service'
import { CreateDemandDto, UpdateDemandDto } from './dto/demands.dto'

@Controller('demands')
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @Post()
  async createDemand(@Body() createDemandDto: CreateDemandDto) {
    console.log('[DemandsController] 创建需求请求:', createDemandDto)
    return this.demandsService.create(createDemandDto)
  }

  @Post('calculate-distance')
  async calculateDistance(@Body() body: {
    pickup_address: string
    pickup_lat: number
    pickup_lng: number
    delivery_address: string
    delivery_lat: number
    delivery_lng: number
  }) {
    console.log('[DemandsController] 计算距离请求:', body)
    return this.demandsService.calculateDistance(body)
  }

  @Get()
  async getDemands(
    @Query('merchant_id') merchantId?: string,
    @Query('status') status?: string
  ) {
    console.log('[DemandsController] 查询需求列表 - merchantId:', merchantId, 'status:', status)
    if (status === 'pending') {
      return this.demandsService.findByStatus('pending')
    }
    return this.demandsService.findByMerchantId(merchantId)
  }

  @Get(':id')
  async getDemandById(@Param('id') id: string) {
    return this.demandsService.findById(id)
  }

  @Put(':id')
  async updateDemand(@Param('id') id: string, @Body() updateDemandDto: UpdateDemandDto) {
    return this.demandsService.update(id, updateDemandDto)
  }

  @Post(':id/cancel')
  async cancelDemand(@Param('id') id: string, @Body('reason') reason: string) {
    return this.demandsService.cancel(id, reason)
  }

  @Post(':id/accept')
  async acceptDemand(
    @Param('id') id: string,
    @Body('ownerId') ownerId: string,
    @Body('vehicleId') vehicleId: string,
    @Body('farePrice') farePrice: number,
    @Body('note') note?: string
  ) {
    console.log('[DemandsController] 接单请求 - demandId:', id, 'ownerId:', ownerId, 'vehicleId:', vehicleId, 'farePrice:', farePrice, 'note:', note)
    return this.demandsService.accept(id, ownerId, vehicleId, farePrice, note)
  }

  @Get('stats/merchant')
  async getMerchantStats(@Query('merchant_id') merchantId: string) {
    console.log('[DemandsController] 获取需求方统计 - merchantId:', merchantId)
    return this.demandsService.getMerchantStats(merchantId)
  }
}
