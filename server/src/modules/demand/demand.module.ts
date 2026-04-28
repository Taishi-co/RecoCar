import { Module } from '@nestjs/common';
import { DemandService } from './demand.service';
import { DemandController } from './demand.controller';

@Module({
  controllers: [DemandController],
  providers: [DemandService],
  exports: [DemandService],
})
export class EnterpriseDemandsModule {}
