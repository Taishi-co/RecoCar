import { Controller, Get, HttpCode } from '@nestjs/common'
import { RentalRemindersService } from './rental-reminders.service'

@Controller('rental-reminders')
export class RentalRemindersController {
  constructor(private readonly rentalRemindersService: RentalRemindersService) {}

  /**
   * 手动触发检查租赁到期情况（用于测试）
   */
  @Get('check-expiry')
  @HttpCode(200)
  async checkExpiry() {
    return await this.rentalRemindersService.checkRentalExpiry()
  }

  /**
   * 获取提醒统计
   */
  @Get('statistics')
  @HttpCode(200)
  async getStatistics() {
    // TODO: 实现统计功能
    return {
      code: 200,
      message: '统计功能开发中',
      data: {}
    }
  }
}
