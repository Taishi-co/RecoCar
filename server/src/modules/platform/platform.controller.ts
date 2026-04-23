import { Controller, Get, Put, Body } from '@nestjs/common'
import { PlatformService } from './platform.service'
import { UpdateSettingsDto } from './dto/platform.dto'

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  // 获取平台配置
  @Get('settings')
  async getSettings() {
    return this.platformService.getSettings()
  }

  // 更新平台配置（管理员）
  @Put('settings')
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    console.log('[PlatformController] 更新平台配置:', updateSettingsDto)
    return this.platformService.updateSettings(updateSettingsDto)
  }

  // 获取平台收款码
  @Get('payment-qr')
  async getPlatformPaymentQr() {
    return this.platformService.getPlatformPaymentQr()
  }
}
