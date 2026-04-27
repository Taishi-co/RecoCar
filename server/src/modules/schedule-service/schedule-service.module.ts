import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ScheduleService } from './schedule-service.service'
import { RentalRemindersModule } from '@/modules/rental-reminders/rental-reminders.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RentalRemindersModule
  ],
  providers: [ScheduleService],
  exports: [ScheduleService]
})
export class ScheduleServiceModule {}
