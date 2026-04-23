import { Controller, Get, Post, Body, Query, ValidationPipe } from '@nestjs/common'
import { MapService } from './map.service'
import { GeocodeDto, DistanceDto, RouteDto, OrderMapDto } from './dto/map.dto'

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  /**
   * 地理编码：将地址转换为经纬度坐标
   * POST /api/map/geocode
   */
  @Post('geocode')
  async geocode(@Body(new ValidationPipe({ transform: true })) geocodeDto: GeocodeDto) {
    return this.mapService.geocode(geocodeDto)
  }

  /**
   * 距离计算：计算两点之间的距离
   * POST /api/map/distance
   */
  @Post('distance')
  async calculateDistance(@Body(new ValidationPipe({ transform: true })) distanceDto: DistanceDto) {
    return this.mapService.calculateDistance(distanceDto)
  }

  /**
   * 路径规划：计算从起点到终点的路线
   * POST /api/map/route
   */
  @Post('route')
  async planRoute(@Body(new ValidationPipe({ transform: true })) routeDto: RouteDto) {
    return this.mapService.planRoute(routeDto)
  }

  /**
   * 获取订单的地图信息（起点、终点、距离、路线）
   * GET /api/map/order-info
   */
  @Get('order-info')
  async getOrderMapInfo(@Query(new ValidationPipe({ transform: true })) query: OrderMapDto) {
    return this.mapService.getOrderMapInfo(query.orderId)
  }
}
