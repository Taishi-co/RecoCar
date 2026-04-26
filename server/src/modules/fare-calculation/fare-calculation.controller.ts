import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common'
import { FareCalculationService, FareCalculationResult } from './fare-calculation.service'

@Controller('fare')
export class FareCalculationController {
  constructor(private readonly fareCalculationService: FareCalculationService) {}

  /**
   * 计算单辆车的运费
   */
  @Post('calculate')
  async calculateFare(@Body() body: {
    vehicle_id: string
    total_distance: number
  }) {
    const { vehicle_id, total_distance } = body

    const result = await this.fareCalculationService.calculateFare(vehicle_id, total_distance)

    return {
      code: 200,
      message: '计算成功',
      data: result
    }
  }

  /**
   * 计算多辆车的运费（用于需求方查看价格区间）
   */
  @Post('calculate-multiple')
  async calculateFareForMultipleVehicles(@Body() body: {
    vehicle_ids: string[]
    pickup_lat: number
    pickup_lng: number
    delivery_lat: number
    delivery_lng: number
  }) {
    const { vehicle_ids, pickup_lat, pickup_lng, delivery_lat, delivery_lng } = body

    const results = await this.fareCalculationService.calculateFareForMultipleVehicles(
      vehicle_ids,
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng
    )

    // 计算价格区间
    const fares = results.map(r => r.total_fare)
    const minFare = Math.min(...fares)
    const maxFare = Math.max(...fares)

    return {
      code: 200,
      message: '计算成功',
      data: {
        vehicles: results,
        fare_range: {
          min: minFare,
          max: maxFare,
          text: `¥${minFare.toFixed(2)} - ¥${maxFare.toFixed(2)}`
        }
      }
    }
  }

  /**
   * 验证定价参数
   */
  @Post('validate-pricing')
  async validatePricing(@Body() body: {
    base_price: number
    base_distance: number
    price_per_km: number
  }) {
    const result = this.fareCalculationService.validatePricing(body)

    return {
      code: 200,
      message: result.valid ? '定价参数合理' : '定价参数不合理',
      data: result
    }
  }
}
