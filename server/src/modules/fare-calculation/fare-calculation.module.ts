import { Module } from '@nestjs/common'
import { FareCalculationService } from './fare-calculation.service'
import { FareCalculationController } from './fare-calculation.controller'

@Module({
  imports: [],
  controllers: [FareCalculationController],
  providers: [FareCalculationService],
  exports: [FareCalculationService],
})
export class FareCalculationModule {}
