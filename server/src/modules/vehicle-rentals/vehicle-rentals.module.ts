import { Module } from '@nestjs/common'
import { VehicleRentalsController } from './vehicle-rentals.controller'
import { VehicleRentalsService } from './vehicle-rentals.service'

@Module({
  controllers: [VehicleRentalsController],
  providers: [VehicleRentalsService],
  exports: [VehicleRentalsService]
})
export class VehicleRentalsModule {}
