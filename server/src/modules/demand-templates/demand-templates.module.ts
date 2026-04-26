import { Module } from '@nestjs/common'
import { DemandTemplatesController } from './demand-templates.controller'
import { DemandTemplatesService } from './demand-templates.service'

@Module({
  controllers: [DemandTemplatesController],
  providers: [DemandTemplatesService],
  exports: [DemandTemplatesService]
})
export class DemandTemplatesModule {}
