import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';

@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  /**
   * 创建企业
   */
  @Post()
  async createEnterprise(@Body() body: {
    name: string;
    type: string;
    adminId: string;
  }) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseService.createEnterprise(body),
    };
  }

  /**
   * 获取企业统计信息（带查询参数）
   */
  @Get('stats')
  async getStatsByQuery(@Query('enterprise_id') enterpriseId: string) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseService.getEnterpriseStats(enterpriseId),
    };
  }

  /**
   * 根据管理员获取企业
   */
  @Get('admin/:adminId')
  async getEnterpriseByAdminId(@Param('adminId') adminId: string) {
    const enterprise = await this.enterpriseService.getEnterpriseByAdminId(adminId);
    return {
      code: 200,
      message: 'success',
      data: enterprise,
    };
  }

  /**
   * 获取企业信息
   */
  @Get(':id')
  async getEnterprise(@Param('id') id: string) {
    const enterprise = await this.enterpriseService.getEnterpriseById(id);
    if (!enterprise) {
      return {
        code: 404,
        message: '企业不存在',
        data: null,
      };
    }
    return {
      code: 200,
      message: 'success',
      data: enterprise,
    };
  }

  /**
   * 更新企业信息
   */
  @Put(':id')
  async updateEnterprise(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      type: string;
      adminId: string;
      status: string;
    }>,
  ) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseService.updateEnterprise(id, body),
    };
  }

  /**
   * 获取企业统计信息
   */
  @Get(':id/stats')
  async getEnterpriseStats(@Param('id') id: string) {
    return {
      code: 200,
      message: 'success',
      data: await this.enterpriseService.getEnterpriseStats(id),
    };
  }
}
