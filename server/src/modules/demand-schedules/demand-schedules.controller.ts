import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { DemandSchedulesService } from './demand-schedules.service'
import { CreateDemandScheduleDto, UpdateDemandScheduleDto } from './dto/demand-schedules.dto'

@Controller('demand-schedules')
export class DemandSchedulesController {
  constructor(private readonly demandSchedulesService: DemandSchedulesService) {}

  @Post()
  async createSchedule(@Body() createDto: CreateDemandScheduleDto) {
    console.log('[DemandSchedulesController] 创建计划请求:', createDto)
    return this.demandSchedulesService.create(createDto)
  }

  @Get()
  async getSchedules(@Query('user_id') userId: string) {
    console.log('[DemandSchedulesController] 查询计划列表 - userId:', userId)
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      }
    }
    return this.demandSchedulesService.findByUserId(userId)
  }

  @Get(':id')
  async getScheduleById(@Param('id') id: string) {
    return this.demandSchedulesService.findById(id)
  }

  @Put(':id')
  async updateSchedule(@Param('id') id: string, @Body() updateDto: UpdateDemandScheduleDto) {
    console.log('[DemandSchedulesController] 更新计划请求 - id:', id, updateDto)
    return this.demandSchedulesService.update(id, updateDto)
  }

  @Post(':id/pause')
  async pauseSchedule(@Param('id') id: string) {
    console.log('[DemandSchedulesController] 暂停计划请求 - id:', id)
    return this.demandSchedulesService.pause(id)
  }

  @Post(':id/resume')
  async resumeSchedule(@Param('id') id: string) {
    console.log('[DemandSchedulesController] 恢复计划请求 - id:', id)
    return this.demandSchedulesService.resume(id)
  }

  @Delete(':id')
  async deleteSchedule(@Param('id') id: string) {
    console.log('[DemandSchedulesController] 删除计划请求 - id:', id)
    return this.demandSchedulesService.delete(id)
  }

  @Get(':id/logs')
  async getScheduleLogs(@Param('id') id: string) {
    console.log('[DemandSchedulesController] 查询发布日志 - id:', id)
    return this.demandSchedulesService.getLogs(id)
  }
}
