import { Controller, Post, Get, Put, Body, UseInterceptors, UploadedFile, Query, ParseIntPipe, Param } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { VehiclesService } from './vehicles.service'
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto'
import { S3Storage } from 'coze-coding-dev-sdk'

@Controller('vehicles')
export class VehiclesController {
  private storage: S3Storage

  constructor(private readonly vehiclesService: VehiclesService) {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing'
    })
  }

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@UploadedFile() photo: Express.Multer.File) {
    console.log('[VehiclesController] 上传照片:', photo?.originalname, '大小:', photo?.size)

    if (!photo) {
      return {
        code: 400,
        message: '未选择照片'
      }
    }

    try {
      const fileKey = await this.storage.uploadFile({
        fileContent: photo.buffer,
        fileName: `vehicles/${photo.originalname}`,
        contentType: photo.mimetype
      })

      console.log('[VehiclesController] 照片上传成功，fileKey:', fileKey)

      // 生成签名 URL，有效期 30 天
      const imageUrl = await this.storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 2592000 // 30 天
      })

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
        message: '上传失败，请重试'
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

  @Put(':id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Body('is_available') isAvailable: boolean
  ) {
    console.log('[VehiclesController] 切换车辆运营状态 - id:', id, 'isAvailable:', isAvailable)
    return this.vehiclesService.updateAvailability(id, isAvailable)
  }
}
