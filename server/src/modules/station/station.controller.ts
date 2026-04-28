import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StationService } from './station.service';

@Controller('station')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  /**
   * 创建奶站
   */
  @Post()
  async createStation(@Body() body: {
    enterpriseId: string;
    name: string;
    address: string;
    location?: { lat: number; lng: number };
    phone?: string;
  }) {
    return {
      code: 200,
      message: 'success',
      data: await this.stationService.createStation(body),
    };
  }

  /**
   * 获取奶站列表
   */
  @Get()
  async getStations(@Query() query: {
    enterpriseId: string;
    page?: string;
    pageSize?: string;
    keyword?: string;
  }) {
    const { enterpriseId, page, pageSize, keyword } = query;
    return {
      code: 200,
      message: 'success',
      data: await this.stationService.getStations({
        enterpriseId,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
        keyword,
      }),
    };
  }

  /**
   * 获取奶站详情
   */
  @Get(':id')
  async getStation(@Param('id') id: string) {
    try {
      const station = await this.stationService.getStationById(id);
      return {
        code: 200,
        message: 'success',
        data: station,
      };
    } catch (error) {
      return {
        code: 404,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 更新奶站信息
   */
  @Put(':id')
  async updateStation(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      address: string;
      location: { lat: number; lng: number };
      phone: string;
      status: string;
    }>,
  ) {
    try {
      return {
        code: 200,
        message: 'success',
        data: await this.stationService.updateStation(id, body),
      };
    } catch (error) {
      return {
        code: 404,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * 删除奶站
   */
  @Delete(':id')
  async deleteStation(@Param('id') id: string) {
    try {
      return {
        code: 200,
        message: 'success',
        data: await this.stationService.deleteStation(id),
      };
    } catch (error) {
      return {
        code: 404,
        message: error.message,
        data: null,
      };
    }
  }
}
