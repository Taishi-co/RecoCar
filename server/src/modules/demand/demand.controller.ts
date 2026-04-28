import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DemandService } from './demand.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('demand')
@UseGuards(JwtAuthGuard)
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  /**
   * 创建配送需求
   */
  @Post()
  async createDemand(@Body() body: {
    enterpriseId: string;
    pickupPointType: string;
    pickupPointInfo: any;
    deliveryPoints: any[];
    cargoInfo: any;
    timeWindow: any;
    vehicleSource: string;
  }) {
    return {
      code: 200,
      message: 'success',
      data: await this.demandService.createDemand(body),
    };
  }

  /**
   * 获取配送需求列表
   */
  @Get()
  async getDemands(@Query() query: {
    enterpriseId: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }) {
    const { enterpriseId, status, page, pageSize } = query;
    return {
      code: 200,
      message: 'success',
      data: await this.demandService.getDemands({
        enterpriseId,
        status,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      }),
    };
  }

  /**
   * 获取配送需求详情
   */
  @Get(':id')
  async getDemand(@Param('id') id: string) {
    const demand = await this.demandService.getDemandById(id);
    if (!demand) {
      return {
        code: 404,
        message: '配送需求不存在',
        data: null,
      };
    }
    return {
      code: 200,
      message: 'success',
      data: demand,
    };
  }

  /**
   * 更新配送需求
   */
  @Put(':id')
  async updateDemand(
    @Param('id') id: string,
    @Body() body: Partial<{
      vehicleAllocation: any;
      optimizedRoutes: any;
      status: string;
    }>,
  ) {
    return {
      code: 200,
      message: 'success',
      data: await this.demandService.updateDemand(id, body),
    };
  }

  /**
   * 获取待调度订单
   */
  @Get('pending/:enterpriseId')
  async getPendingDemands(@Param('enterpriseId') enterpriseId: string) {
    return {
      code: 200,
      message: 'success',
      data: await this.demandService.getPendingDemands(enterpriseId),
    };
  }
}
