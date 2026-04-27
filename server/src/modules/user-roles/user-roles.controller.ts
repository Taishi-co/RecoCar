import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { UserRolesService } from './user-roles.service'
import { CreateRoleDto, SwitchRoleDto, GetUserRolesDto } from './dto/user-roles.dto'

@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get('my-roles')
  async getMyRoles(@Query('userId') userId: string) {
    console.log('[UserRolesController] 获取我的角色 - userId:', userId)
    return this.userRolesService.getUserRoles(userId)
  }

  @Get('active')
  async getActiveRole(@Query('userId') userId: string) {
    console.log('[UserRolesController] 获取当前激活角色 - userId:', userId)
    return this.userRolesService.getActiveRole(userId)
  }

  @Post('create')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    console.log('[UserRolesController] 创建角色 - userId:', createRoleDto.userId, 'role:', createRoleDto.role)
    return this.userRolesService.createRole(createRoleDto)
  }

  @Post('switch')
  async switchRole(@Body() switchRoleDto: SwitchRoleDto) {
    console.log('[UserRolesController] 切换角色 - userId:', switchRoleDto.userId, 'roleId:', switchRoleDto.roleId)
    return this.userRolesService.switchRole(switchRoleDto)
  }
}
