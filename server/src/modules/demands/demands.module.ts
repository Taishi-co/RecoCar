import { Module, forwardRef } from '@nestjs/common'
import { DemandsService } from './demands.service'
import { DemandsController } from './demands.controller'
import { NotificationsModule } from '../notifications/notification.module'
import { FareCalculationModule } from '../fare-calculation/fare-calculation.module'
import { DemandTemplatesModule } from '../demand-templates/demand-templates.module'

@Module({
  imports: [NotificationsModule, FareCalculationModule, forwardRef(() => DemandTemplatesModule)],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService]
})
export class DemandsModule {}
