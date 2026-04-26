import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 运费计算详情接口
export interface FareCalculationDetail {
  base_price: number
  base_distance: number
  price_per_km: number
  total_distance: number
  extra_distance: number
  extra_fare: number
  total_fare: number
}

// 运费计算结果接口
export interface FareCalculationResult {
  vehicle_id: string
  vehicle_type: string
  base_price: number
  base_distance: number
  price_per_km: number
  total_distance: number
  extra_distance: number
  extra_fare: number
  total_fare: number
  calculation_detail: FareCalculationDetail
}

@Injectable()
export class FareCalculationService {
  private supabase = getSupabaseClient()

  /**
   * 根据车辆和距离计算运费
   */
  async calculateFare(vehicleId: string, totalDistance: number): Promise<FareCalculationResult> {
    // 1. 获取车辆定价信息
    const { data: vehicle, error: vehicleError } = await this.supabase
      .from('vehicles')
      .select('id, vehicle_type, base_price, base_distance, price_per_km')
      .eq('id', vehicleId)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      throw new BadRequestException('车辆不存在或定价信息不完整')
    }

    // 2. 验证定价信息完整性
    if (vehicle.base_price === null || vehicle.base_distance === null || vehicle.price_per_km === null) {
      throw new BadRequestException('车辆定价信息不完整，请先设置定价')
    }

    const basePrice = parseFloat(vehicle.base_price as any)
    const baseDistance = parseFloat(vehicle.base_distance as any)
    const pricePerKm = parseFloat(vehicle.price_per_km as any)

    // 3. 计算额外距离
    let extraDistance = totalDistance - baseDistance
    if (extraDistance < 0) {
      extraDistance = 0
    }

    // 4. 计算额外费用
    const extraFare = extraDistance * pricePerKm

    // 5. 计算总运费
    const totalFare = basePrice + extraFare

    // 6. 构建计算详情
    const calculationDetail: FareCalculationDetail = {
      base_price: basePrice,
      base_distance: baseDistance,
      price_per_km: pricePerKm,
      total_distance: totalDistance,
      extra_distance: extraDistance,
      extra_fare: extraFare,
      total_fare: totalFare
    }

    // 7. 返回计算结果
    return {
      vehicle_id: vehicle.id,
      vehicle_type: vehicle.vehicle_type,
      base_price: basePrice,
      base_distance: baseDistance,
      price_per_km: pricePerKm,
      total_distance: totalDistance,
      extra_distance: extraDistance,
      extra_fare: extraFare,
      total_fare: totalFare,
      calculation_detail: calculationDetail
    }
  }

  /**
   * 验证定价参数的合理性
   */
  validatePricing(params: {
    base_price: number
    base_distance: number
    price_per_km: number
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 范围检查
    if (params.base_price < 10 || params.base_price > 500) {
      errors.push('起步价必须在 10-500 元之间')
    }

    if (params.base_distance < 1 || params.base_distance > 10) {
      errors.push('起步公里数必须在 1-10 公里之间')
    }

    if (params.price_per_km < 0.5 || params.price_per_km > 20) {
      errors.push('每公里运价必须在 0.5-20 元之间')
    }

    // 组合检查
    const unitBasePrice = params.base_price / params.base_distance
    if (unitBasePrice > 100) {
      errors.push('起步价与起步公里数的比例过高，请调整定价')
    }

    const baseFare = params.base_price * params.base_distance
    if (baseFare > 500) {
      errors.push('起步费过高，请调整定价')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 根据起止点坐标计算多辆车的运费（用于需求方查看价格区间）
   */
  async calculateFareForMultipleVehicles(
    vehicleIds: string[],
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number
  ): Promise<FareCalculationResult[]> {
    // 1. 调用距离计算服务（这里需要注入 DemandsService 或单独的距离计算服务）
    // 为了简化，这里假设距离已经计算好
    // 实际项目中，应该调用 DemandsService.calculateDistance()

    // 临时方案：使用直线距离估算
    const distance = this.calculateStraightDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)

    // 2. 为每辆车计算运费
    const results: FareCalculationResult[] = []
    for (const vehicleId of vehicleIds) {
      try {
        const fareResult = await this.calculateFare(vehicleId, distance)
        results.push(fareResult)
      } catch (error) {
        console.error(`计算车辆 ${vehicleId} 运费失败:`, error)
      }
    }

    return results
  }

  /**
   * 计算直线距离（Haversine公式）
   */
  private calculateStraightDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // 地球半径，单位：公里
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}
