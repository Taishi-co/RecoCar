import { Module } from '@nestjs/common';
import { VehicleMockService } from './vehicle-mock.service';
import { VehicleMockController } from './vehicle-mock.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [ScheduleModule.forRoot(), EventEmitterModule.forRoot()],
  controllers: [VehicleMockController],
  providers: [VehicleMockService],
  exports: [VehicleMockService],
})
export class VehicleMockModule {}
