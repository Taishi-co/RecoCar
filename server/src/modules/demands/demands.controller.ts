import { Controller, Post, Get, Put, Body, Query } from '@nestjs/common'
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
  async getDemands(@Query('merchant_id') merchantId?: string) {
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
}
