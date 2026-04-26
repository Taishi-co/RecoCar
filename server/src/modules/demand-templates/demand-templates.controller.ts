import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { DemandTemplatesService } from './demand-templates.service'
import { CreateDemandTemplateDto, UpdateDemandTemplateDto } from './dto/demand-templates.dto'

@Controller('demand-templates')
export class DemandTemplatesController {
  constructor(private readonly demandTemplatesService: DemandTemplatesService) {}

  @Post()
  async createTemplate(@Body() createDto: CreateDemandTemplateDto) {
    console.log('[DemandTemplatesController] 创建模板请求:', createDto)
    return this.demandTemplatesService.create(createDto)
  }

  @Get()
  async getTemplates(@Query('user_id') userId: string) {
    console.log('[DemandTemplatesController] 查询模板列表 - userId:', userId)
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      }
    }
    return this.demandTemplatesService.findByUserId(userId)
  }

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return this.demandTemplatesService.findById(id)
  }

  @Put(':id')
  async updateTemplate(@Param('id') id: string, @Body() updateDto: UpdateDemandTemplateDto) {
    console.log('[DemandTemplatesController] 更新模板请求 - id:', id, updateDto)
    return this.demandTemplatesService.update(id, updateDto)
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    console.log('[DemandTemplatesController] 删除模板请求 - id:', id)
    return this.demandTemplatesService.delete(id)
  }

  @Post(':id/set-default')
  async setDefaultTemplate(@Param('id') id: string) {
    console.log('[DemandTemplatesController] 设置默认模板请求 - id:', id)
    return this.demandTemplatesService.setDefault(id)
  }
}
