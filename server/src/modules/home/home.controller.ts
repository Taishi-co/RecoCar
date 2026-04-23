import { Controller, Get } from '@nestjs/common'
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
}
