import { Controller, Post, Get, Put, Body, UseInterceptors, UploadedFile, Query, ParseIntPipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { VehiclesService } from './vehicles.service'
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto'

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photos'))
  async createVehicle(
    @UploadedFile() photos: any,
    @Body() createVehicleDto: CreateVehicleDto
  ) {
    console.log('[VehiclesController] 创建车辆请求:', createVehicleDto)
    return this.vehiclesService.create(createVehicleDto, photos)
  }

  @Get()
  async getVehicles(@Query('owner_id') ownerId?: string) {
    return this.vehiclesService.findByOwnerId(ownerId)
  }

  @Get(':id')
  async getVehicleById(@Query('id') id: string) {
    return this.vehiclesService.findById(id)
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photos'))
  async updateVehicle(
    @Query('id') id: string,
    @UploadedFile() photos: any,
    @Body() updateVehicleDto: UpdateVehicleDto
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, photos)
  }

  @Put(':id/status')
  async updateVehicleStatus(
    @Query('id') id: string,
    @Body('status') status: string
  ) {
    return this.vehiclesService.updateStatus(id, status)
  }
}
