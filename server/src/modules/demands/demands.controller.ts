import { Controller, Post, Get, Put, Body, Query, Req } from '@nestjs/common'
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
  async getDemandById(@Query('id') id: string) {
    return this.demandsService.findById(id)
  }

  @Put(':id')
  async updateDemand(@Query('id') id: string, @Body() updateDemandDto: UpdateDemandDto) {
    return this.demandsService.update(id, updateDemandDto)
  }

  @Post(':id/cancel')
  async cancelDemand(@Query('id') id: string, @Body('reason') reason: string) {
    return this.demandsService.cancel(id, reason)
  }

  @Post(':id/accept')
  async acceptDemand(@Query('id') id: string, @Req() req, @Body('note') note?: string) {
    const ownerId = req.user?.id
    console.log('[DemandsController] 接单请求 - demandId:', id, 'ownerId:', ownerId, 'note:', note)
    return this.demandsService.accept(id, ownerId, note)
  }
}
