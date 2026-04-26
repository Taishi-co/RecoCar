import { Module } from '@nestjs/common'
import { DemandSchedulesController } from './demand-schedules.controller'
import { DemandSchedulesService } from './demand-schedules.service'

@Module({
  controllers: [DemandSchedulesController],
  providers: [DemandSchedulesService],
  exports: [DemandSchedulesService]
})
export class DemandSchedulesModule {}
