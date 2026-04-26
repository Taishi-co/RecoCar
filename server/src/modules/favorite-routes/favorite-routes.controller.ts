import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { FavoriteRoutesService } from './favorite-routes.service'
import { CreateRouteDto, UpdateRouteDto } from './dto/favorite-routes.dto'

@Controller('favorite-routes')
export class FavoriteRoutesController {
  constructor(private readonly favoriteRoutesService: FavoriteRoutesService) {}

  @Post()
  async createRoute(@Body() createRouteDto: CreateRouteDto) {
    console.log('[FavoriteRoutesController] 创建线路请求:', createRouteDto)
    return this.favoriteRoutesService.create(createRouteDto)
  }

  @Get()
  async getRoutes(@Query('user_id') userId: string) {
    console.log('[FavoriteRoutesController] 查询线路列表 - userId:', userId)
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      }
    }
    return this.favoriteRoutesService.findByUserId(userId)
  }

  @Get(':id')
  async getRouteById(@Param('id') id: string) {
    return this.favoriteRoutesService.findById(id)
  }

  @Put(':id')
  async updateRoute(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    console.log('[FavoriteRoutesController] 更新线路请求 - id:', id, updateRouteDto)
    return this.favoriteRoutesService.update(id, updateRouteDto)
  }

  @Delete(':id')
  async deleteRoute(@Param('id') id: string) {
    console.log('[FavoriteRoutesController] 删除线路请求 - id:', id)
    return this.favoriteRoutesService.delete(id)
  }

  @Post(':id/increment-use-count')
  async incrementUseCount(@Param('id') id: string) {
    console.log('[FavoriteRoutesController] 增加使用次数请求 - id:', id)
    return this.favoriteRoutesService.incrementUseCount(id)
  }
}
