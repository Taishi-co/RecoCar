import { Module } from '@nestjs/common'
import { RentalRemindersController } from './rental-reminders.controller'
import { RentalRemindersService } from './rental-reminders.service'

@Module({
  controllers: [RentalRemindersController],
  providers: [RentalRemindersService],
  exports: [RentalRemindersService]
})
export class RentalRemindersModule {}
