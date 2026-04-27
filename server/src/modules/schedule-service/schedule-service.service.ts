import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RentalRemindersService } from '@/modules/rental-reminders/rental-reminders.service'

@Injectable()
export class ScheduleService {
  constructor(private readonly rentalRemindersService: RentalRemindersService) {}

  /**
   * 每天凌晨2点检查租赁到期情况
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleRentalExpiryCheck() {
    console.log('[ScheduleService] 执行租赁到期检查任务...')
    try {
      await this.rentalRemindersService.checkRentalExpiry()
    } catch (error) {
      console.error('[ScheduleService] 租赁到期检查任务失败:', error)
    }
  }

  /**
   * 手动触发租赁到期检查（用于测试）
   */
  async triggerRentalExpiryCheck() {
    return await this.rentalRemindersService.checkRentalExpiry()
  }
}
