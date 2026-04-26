import { Module } from '@nestjs/common'
import { DemandsService } from './demands.service'
import { DemandsController } from './demands.controller'
import { NotificationsModule } from '../notifications/notification.module'
import { FareCalculationModule } from '../fare-calculation/fare-calculation.module'

@Module({
  imports: [NotificationsModule, FareCalculationModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService]
})
export class DemandsModule {}
