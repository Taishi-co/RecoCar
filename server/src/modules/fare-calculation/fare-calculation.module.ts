import { Module, forwardRef } from '@nestjs/common'
import { FareCalculationService } from './fare-calculation.service'
import { FareCalculationController } from './fare-calculation.controller'
import { DemandsModule } from '../demands/demands.module'

@Module({
  imports: [forwardRef(() => DemandsModule)],
  controllers: [FareCalculationController],
  providers: [FareCalculationService],
  exports: [FareCalculationService],
})
export class FareCalculationModule {}
