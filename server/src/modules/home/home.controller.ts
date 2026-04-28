import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException, HttpCode, Body } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { HomeService } from './home.service'

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('statistics')
  async getStatistics() {
    return this.homeService.getStatistics()
  }

  @Get('latest-info')
  async getLatestInfo() {
    return this.homeService.getLatestInfo()
  }

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.homeService.uploadFile(file)
  }

  @Post('analyze-cargo')
  @HttpCode(200)
  async analyzeCargo(@Body() body: { photos: string[] }) {
    return this.homeService.analyzeCargoPhotos(body.photos)
  }
}
