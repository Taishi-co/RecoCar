import { Module } from '@nestjs/common'
import { ScheduleService } from './schedule.service'
import { DemandsModule } from '../demands/demands.module'
import { DemandSchedulesModule } from '../demand-schedules/demand-schedules.module'
import { DemandTemplatesModule } from '../demand-templates/demand-templates.module'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [DemandsModule, DemandSchedulesModule, DemandTemplatesModule, ScheduleModule.forRoot()],
  providers: [ScheduleService],
  exports: [ScheduleService]
})
export class ScheduleServiceModule {}
