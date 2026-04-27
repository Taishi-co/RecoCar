import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common'
import { VehicleRentalsService } from './vehicle-rentals.service'
import { CreateRentalDto, ConfirmRentalDto, ConfirmReturnDto } from './dto/vehicle-rentals.dto'

@Controller('rentals')
export class VehicleRentalsController {
  constructor(private readonly vehicleRentalsService: VehicleRentalsService) {}

  @Get('available-vehicles')
  async getAvailableVehicles() {
    console.log('[VehicleRentalsController] 获取可租赁车辆列表')
    return this.vehicleRentalsService.getAvailableVehicles()
  }

  @Get('pending-for-owner')
  async getPendingRentalsForOwner(@Query('owner_id') ownerId: string) {
    console.log('[VehicleRentalsController] 获取车主待确认租赁申请 - ownerId:', ownerId)
    return this.vehicleRentalsService.getPendingRentalsForOwner(ownerId)
  }

  @Get('vehicle/:vehicleId/info')
  async getVehicleRentalInfo(@Param('vehicleId') vehicleId: string) {
    console.log('[VehicleRentalsController] 获取车辆租赁信息 - vehicleId:', vehicleId)
    return this.vehicleRentalsService.getVehicleRentalInfo(vehicleId)
  }

  @Post()
  async createRental(
    @Body() body: {
      vehicle_id: string
      owner_id: string
      rent_type: string
      rent_start_date: string
      rent_end_date: string
      contract_signed?: boolean
      rent_paid?: boolean
      deposit_paid?: boolean
      deposit_amount?: number
      notes?: string
      renter_id?: string
    }
  ) {
    console.log('[VehicleRentalsController] 创建租赁关系 - renterId:', body.renter_id, 'body:', body)

    // 构建 DTO
    const createRentalDto: CreateRentalDto = {
      vehicle_id: body.vehicle_id,
      owner_id: body.owner_id,
      rent_type: body.rent_type as 'monthly' | 'yearly',
      rent_start_date: body.rent_start_date,
      rent_end_date: body.rent_end_date,
      contract_signed: body.contract_signed ?? false,
      rent_paid: body.rent_paid ?? false,
      deposit_paid: body.deposit_paid ?? false,
      deposit_amount: body.deposit_amount ?? 0,
      notes: body.notes
    }

    return this.vehicleRentalsService.create(createRentalDto, body.renter_id)
  }

  @Get('my')
  async getMyRentals(@Query('user_id') userId: string) {
    console.log('[VehicleRentalsController] 获取我的租赁记录 - userId:', userId)
    return this.vehicleRentalsService.findByUserId(userId)
  }

  @Get(':id')
  async getRentalById(@Param('id') id: string) {
    console.log('[VehicleRentalsController] 获取租赁关系详情 - id:', id)
    return this.vehicleRentalsService.findById(id)
  }

  @Post(':id/confirm-owner')
  async confirmByOwner(
    @Param('id') id: string,
    @Body() confirmRentalDto: ConfirmRentalDto,
    @Body('owner_id') ownerId: string
  ) {
    console.log('[VehicleRentalsController] 车主确认租赁 - id:', id, 'ownerId:', ownerId)
    return this.vehicleRentalsService.confirmByOwner(id, confirmRentalDto, ownerId)
  }

  @Post(':id/confirm-return')
  async confirmReturn(
    @Param('id') id: string,
    @Body() confirmReturnDto: ConfirmReturnDto,
    @Body('owner_id') ownerId: string
  ) {
    console.log('[VehicleRentalsController] 确认车辆归还 - id:', id, 'ownerId:', ownerId)
    return this.vehicleRentalsService.confirmReturn(id, confirmReturnDto, ownerId)
  }
}
