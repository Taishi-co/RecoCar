import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { EnterpriseVehiclesService } from './enterprise-vehicles.service';

@Controller('enterprise-vehicles')
export class EnterpriseVehiclesController {
  constructor(private readonly enterpriseVehiclesService: EnterpriseVehiclesService) {}

  /**
   * 获取企业车辆列表
   */
  @Get()
  async getVehicles(@Query('enterprise_id') enterpriseId: string) {
    if (!enterpriseId) {
      return {
        code: 400,
        message: '缺少企业ID',
        data: null,
      };
    }

    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseVehiclesService.getEnterpriseVehicles(enterpriseId),
    };
  }

  /**
   * 获取企业车辆统计
   */
  @Get('stats')
  async getStats(@Query('enterprise_id') enterpriseId: string) {
    if (!enterpriseId) {
      return {
        code: 400,
        message: '缺少企业ID',
        data: null,
      };
    }

    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseVehiclesService.getEnterpriseVehicleStats(enterpriseId),
    };
  }

  /**
   * 创建企业车辆
   */
  @Post()
  async createVehicle(@Body() body: {
    enterprise_id: string;
    vehicle_code: string;
    vehicle_type: string;
    load_capacity: number;
    volume: number;
    current_location: string;
    usage_mode?: 'internal' | 'external' | 'both';
  }) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseVehiclesService.createEnterpriseVehicle(
        body.enterprise_id,
        {
          vehicle_code: body.vehicle_code,
          vehicle_type: body.vehicle_type,
          license_plate: body.vehicle_code,
          load_capacity: body.load_capacity,
          volume: body.volume,
          current_location: body.current_location,
          usage_mode: body.usage_mode || 'internal',
        },
      ),
    };
  }

  /**
   * 更新车辆使用模式
   */
  @Put(':id/usage-mode')
  async updateUsageMode(
    @Param('id') id: string,
    @Body('usage_mode') usageMode: 'internal' | 'external' | 'both',
  ) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseVehiclesService.updateVehicleUsageMode(id, usageMode),
    };
  }

  /**
   * 更新车辆今日统计
   */
  @Put(':id/today-stats')
  async updateTodayStats(
    @Param('id') id: string,
    @Body() body: {
      internal_orders?: number;
      external_orders?: number;
      distance?: number;
    },
  ) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseVehiclesService.updateVehicleTodayStats(id, body),
    };
  }
}
