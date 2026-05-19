import { Controller, Post, Get, Put, Body, UseInterceptors, UploadedFile, Query, ParseIntPipe, Param } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { VehiclesService } from './vehicles.service'
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto'
import { createFileStorage, type FileStorage } from '@/storage/file-storage'

@Controller('vehicles')
export class VehiclesController {
  private storage: FileStorage

  constructor(private readonly vehiclesService: VehiclesService) {
    this.storage = createFileStorage()
  }

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@UploadedFile() photo: Express.Multer.File) {
    console.log('[VehiclesController] 上传照片:', photo?.originalname, '大小:', photo?.size)

    if (!photo) {
      console.error('[VehiclesController] 未选择照片')
      return {
        code: 400,
        message: '未选择照片'
      }
    }

    try {
      const fileKey = await this.storage.uploadFile({
        fileContent: photo.buffer,
        fileName: `vehicles/${Date.now()}_${photo.originalname}`,
        contentType: photo.mimetype
      })

      console.log('[VehiclesController] 照片上传成功，fileKey:', fileKey)

      // 生成签名 URL，有效期 30 天
      const imageUrl = await this.storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 2592000 // 30 天
      })

      console.log('[VehiclesController] 签名 URL 生成成功:', imageUrl)

      return {
        code: 200,
        message: '上传成功',
        data: {
          fileKey,
          url: imageUrl
        }
      }
    } catch (error) {
      console.error('[VehiclesController] 照片上传失败:', error)
      return {
        code: 500,
        message: `上传失败: ${error.message || '未知错误'}`
      }
    }
  }

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
  async getVehicles(@Query('owner_id') ownerId?: string, @Query('user_id') userId?: string) {
    return this.vehiclesService.findByOwnerId(ownerId, userId)
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

  @Put(':id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Body('is_available') isAvailable: boolean,
    @Body('user_id') userId?: string
  ) {
    console.log('[VehiclesController] 切换车辆运营状态 - id:', id, 'isAvailable:', isAvailable, 'userId:', userId)
    return this.vehiclesService.updateAvailability(id, isAvailable, userId)
  }

  @Get(':id/rental-settings')
  async getRentalSettings(@Param('id') id: string) {
    console.log('[VehiclesController] 获取车辆租赁设置 - id:', id)
    return this.vehiclesService.getRentalSettings(id)
  }

  @Put(':id/rental-settings')
  async updateRentalSettings(
    @Param('id') id: string,
    @Body() body: {
      is_available_for_rent?: boolean
      rent_monthly_price?: number
      rent_yearly_price?: number
      rent_deposit?: number
      contact_phone?: string
      contact_wechat?: string
      notes?: string
    }
  ) {
    console.log('[VehiclesController] 更新车辆租赁设置 - id:', id, 'body:', body)
    return this.vehiclesService.updateRentalSettings(id, body)
  }
}
