import { Module } from '@nestjs/common';
import { EnterpriseVehiclesController } from './enterprise-vehicles.controller';
import { EnterpriseVehiclesService } from './enterprise-vehicles.service';

@Module({
  controllers: [EnterpriseVehiclesController],
  providers: [EnterpriseVehiclesService],
  exports: [EnterpriseVehiclesService],
})
export class EnterpriseVehiclesModule {}
