import { Injectable, BadRequestException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { GeocodeDto, DistanceDto, RouteDto } from './dto/map.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class MapService {
  private readonly AMAP_KEY = process.env.AMAP_KEY || 'your_amap_key_here'
  private readonly AMAP_BASE_URL = 'https://restapi.amap.com/v3'

  constructor(private readonly httpService: HttpService) {}

  /**
   * 地理编码：将地址转换为经纬度坐标
   */
  async geocode(geocodeDto: GeocodeDto) {
    const { address, city } = geocodeDto

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(`${this.AMAP_BASE_URL}/geocode/geo`, {
          params: {
            address,
            city: city || '',
            key: this.AMAP_KEY
          }
        })
      )

      if (response.data.status !== '1') {
        throw new BadRequestException(`地理编码失败: ${response.data.info}`)
      }

      if (!response.data.geocodes || response.data.geocodes.length === 0) {
        throw new BadRequestException('未找到地址对应的坐标')
      }

      const location = response.data.geocodes[0].location
      const [lng, lat] = location.split(',')

      return {
        code: 200,
        message: '地理编码成功',
        data: {
          address,
          formattedAddress: response.data.geocodes[0].formatted_address,
          location: {
            longitude: parseFloat(lng),
            latitude: parseFloat(lat)
          },
          adcode: response.data.geocodes[0].adcode,
          level: response.data.geocodes[0].level
        }
      }
    } catch (error) {
      console.error('[MapService] 地理编码失败:', error)
      throw new BadRequestException(`地理编码失败: ${error.message}`)
    }
  }

  /**
   * 距离计算：计算两点之间的距离
   */
  async calculateDistance(distanceDto: DistanceDto) {
    const { origin, destination, type } = distanceDto

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(`${this.AMAP_BASE_URL}/distance`, {
          params: {
            origins: origin,
            destination,
            type: type || '1',
            key: this.AMAP_KEY
          }
        })
      )

      if (response.data.status !== '1') {
        throw new BadRequestException(`距离计算失败: ${response.data.info}`)
      }

      if (!response.data.results || response.data.results.length === 0) {
        throw new BadRequestException('距离计算结果为空')
      }

      const result = response.data.results[0]

      return {
        code: 200,
        message: '距离计算成功',
        data: {
          distance: parseFloat(result.distance), // 米
          duration: parseFloat(result.duration), // 秒
          distanceText: this.formatDistance(result.distance),
          durationText: this.formatDuration(result.duration)
        }
      }
    } catch (error) {
      console.error('[MapService] 距离计算失败:', error)
      throw new BadRequestException(`距离计算失败: ${error.message}`)
    }
  }

  /**
   * 路径规划：计算从起点到终点的路线
   */
  async planRoute(routeDto: RouteDto) {
    const { origin, destination, strategy, extensions } = routeDto

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(`${this.AMAP_BASE_URL}/direction/driving`, {
          params: {
            origin,
            destination,
            strategy: strategy || '1',
            extensions: extensions || 'all',
            key: this.AMAP_KEY
          }
        })
      )

      if (response.data.status !== '1') {
        throw new BadRequestException(`路径规划失败: ${response.data.info}`)
      }

      const route = response.data.route

      if (!route || !route.paths || route.paths.length === 0) {
        throw new BadRequestException('未找到可用路线')
      }

      const path = route.paths[0]

      // 解析路线坐标点
      const points: Array<{ longitude: number; latitude: number }> = []
      if (path.steps) {
        path.steps.forEach((step: any) => {
          const polyline = step.polyline
          if (polyline) {
            polyline.split(';').forEach((pointStr: string) => {
              const [lng, lat] = pointStr.split(',')
              points.push({
                longitude: parseFloat(lng),
                latitude: parseFloat(lat)
              })
            })
          }
        })
      }

      return {
        code: 200,
        message: '路径规划成功',
        data: {
          distance: parseFloat(path.distance), // 米
          duration: parseFloat(path.duration), // 秒
          distanceText: this.formatDistance(path.distance),
          durationText: this.formatDuration(path.duration),
          tolls: path.tolls || 0, // 过路费（元）
          tollDistance: path.toll_distance || 0, // 收费路段距离（米）
          restriction: path.restriction || 0, // 限行距离（米）
          steps: path.steps?.map((step: any) => ({
            instruction: step.instruction,
            distance: parseFloat(step.distance),
            duration: parseFloat(step.duration),
            road: step.road,
            action: step.action
          })) || [],
          polyline: points // 坐标点数组
        }
      }
    } catch (error) {
      console.error('[MapService] 路径规划失败:', error)
      throw new BadRequestException(`路径规划失败: ${error.message}`)
    }
  }

  /**
   * 获取订单的地图信息（起点、终点、距离、路线）
   */
  async getOrderMapInfo(orderId: string) {
    const client = getSupabaseClient()

    // 查询订单信息
    const { data: order, error: orderError } = await client
      .from('orders')
      .select(`
        *,
        demands (
          pickup_address,
          pickup_location,
          delivery_address,
          delivery_location
        )
      `)
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      throw new BadRequestException('订单不存在')
    }

    const demand = order.demands as any

    if (!demand || !demand.pickup_location || !demand.delivery_location) {
      throw new BadRequestException('订单缺少位置信息')
    }

    const pickupLocation = demand.pickup_location as { lat: number; lng: number }
    const deliveryLocation = demand.delivery_location as { lat: number; lng: number }

    const origin = `${pickupLocation.lng},${pickupLocation.lat}`
    const destination = `${deliveryLocation.lng},${deliveryLocation.lat}`

    // 计算距离
    let distanceData: any = null
    try {
      const distanceResult = await this.calculateDistance({
        origin,
        destination,
        type: '1' // 驾车距离
      })
      distanceData = distanceResult.data
    } catch (error) {
      console.error('[MapService] 距离计算失败:', error)
    }

    // 规划路线
    let routeData: any = null
    try {
      const routeResult = await this.planRoute({
        origin,
        destination,
        strategy: '1', // 速度优先
        extensions: 'base' // 基础信息
      })
      routeData = routeResult.data
    } catch (error) {
      console.error('[MapService] 路径规划失败:', error)
    }

    return {
      code: 200,
      message: '查询成功',
      data: {
        orderId: order.id,
        pickup: {
          address: demand.pickup_address,
          location: pickupLocation
        },
        delivery: {
          address: demand.delivery_address,
          location: deliveryLocation
        },
        distance: distanceData?.distanceText || '未知',
        duration: distanceData?.durationText || '未知',
        route: routeData?.polyline || []
      }
    }
  }

  /**
   * 格式化距离显示
   */
  private formatDistance(meters: string | number): string {
    const distance = parseFloat(meters.toString())

    if (distance < 1000) {
      return `${Math.round(distance)}米`
    } else {
      return `${(distance / 1000).toFixed(1)}公里`
    }
  }

  /**
   * 格式化时长显示
   */
  private formatDuration(seconds: string | number): string {
    const duration = parseFloat(seconds.toString())
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }
}
