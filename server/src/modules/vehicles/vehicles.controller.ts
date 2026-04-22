import { Controller, Post, Get, Put, Body, UseInterceptors, UploadedFile, Query, ParseIntPipe, Param } from '@nestjs/common'
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
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.findById(id)
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photos'))
  async updateVehicle(
    @Param('id') id: string,
    @UploadedFile() photos: any,
    @Body() updateVehicleDto: UpdateVehicleDto
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, photos)
  }

  @Put(':id/status')
  async updateVehicleStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.vehiclesService.updateStatus(id, status)
  }

  @Post(':id/review')
  async reviewVehicle(
    @Param('id') id: string,
    @Body('action') action: string,
    @Body('reason') reason?: string
  ) {
    console.log('[VehiclesController] 车辆审核请求 - id:', id, 'action:', action, 'reason:', reason)
    return this.vehiclesService.review(id, action, reason)
  }

  @Post(':id/resubmit')
  async resubmitVehicle(@Param('id') id: string) {
    console.log('[VehiclesController] 车辆重新提交请求 - id:', id)
    return this.vehiclesService.resubmit(id)
  }
}
