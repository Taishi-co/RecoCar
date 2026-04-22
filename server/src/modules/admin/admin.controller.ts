import { Controller, Get, Put, Query, Body, Param } from '@nestjs/common'
import { AdminService } from './admin.service'
import { GetUsersDto, UpdateUserStatusDto } from './dto/admin.dto'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query() filters: GetUsersDto) {
    return this.adminService.getUsers(filters)
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStatusDto
  ) {
    return this.adminService.updateUserStatus(id, updateDto.status)
  }

  @Get('orders')
  async getOrders(@Query('status') status?: string) {
    return this.adminService.getOrders({ status })
  }

  @Get('statistics')
  async getStatistics() {
    return this.adminService.getStatistics()
  }
}
