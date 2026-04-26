import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common'
import { getSupabaseClient } from '../../storage/database/supabase-client'
import { DemandsService } from '../demands/demands.service'

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
  // 路线信息
  route_type: 'highway' | 'non_highway' | 'estimated'
  is_estimate: boolean
  route_duration?: number
}

@Injectable()
export class FareCalculationService {
  private supabase = getSupabaseClient()

  constructor(
    @Inject(forwardRef(() => DemandsService))
    private readonly demandsService: DemandsService
  ) {}

  /**
   * 根据车辆和距离计算运费
   */
  async calculateFare(vehicleId: string, totalDistance: number): Promise<FareCalculationResult> {
    console.log(`[FareCalculationService] INFO - 开始计算运费: vehicleId=${vehicleId}, distance=${totalDistance}km`)

    // 1. 获取车辆定价信息
    const { data: vehicle, error: vehicleError } = await this.supabase
      .from('vehicles')
      .select('id, vehicle_type, base_price, base_distance, price_per_km')
      .eq('id', vehicleId)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      console.error(`[FareCalculationService] ERROR - 车辆不存在: vehicleId=${vehicleId}`)
      throw new BadRequestException('车辆不存在或定价信息不完整')
    }

    // 2. 验证定价信息完整性
    if (vehicle.base_price === null || vehicle.base_distance === null || vehicle.price_per_km === null) {
      console.error(`[FareCalculationService] ERROR - 车辆定价信息不完整: vehicleId=${vehicleId}`)
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

    console.log(
      `[FareCalculationService] INFO - 运费计算完成: vehicleId=${vehicleId}, ` +
      `basePrice=¥${basePrice}, baseDistance=${baseDistance}km, ` +
      `pricePerKm=¥${pricePerKm}/km, totalDistance=${totalDistance}km, ` +
      `extraDistance=${extraDistance}km, extraFare=¥${extraFare.toFixed(2)}, totalFare=¥${totalFare.toFixed(2)}`
    )

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
      calculation_detail: calculationDetail,
      route_type: 'non_highway', // 默认非高速路线
      is_estimate: false // 默认非估算值
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
    console.log(
      `[FareCalculationService] INFO - 开始计算多车辆运费: ` +
      `vehicleIds=[${vehicleIds.join(', ')}], ` +
      `pickup=(${pickupLat}, ${pickupLng}), ` +
      `delivery=(${deliveryLat}, ${deliveryLng})`
    )

    let distance: number
    let routeType: 'non_highway' | 'estimated'
    let isEstimate: boolean
    let routeDuration: number | undefined

    try {
      // 1. 调用 DemandsService 的精确距离计算（高德地图 API 或降级方案）
      const distanceResult = await this.demandsService.calculateDistance({
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng
      })

      // 2. 提取距离和路线信息（从返回的数据结构中）
      distance = distanceResult.data.distance
      routeType = distanceResult.data.route_type
      isEstimate = distanceResult.data.is_estimate || false
      routeDuration = distanceResult.data.route_duration

      console.log(
        `[FareCalculationService] INFO - 距离计算完成: ` +
        `distance=${distance}km, routeType=${routeType}, ` +
        `isEstimate=${isEstimate}, duration=${routeDuration}min`
      )
    } catch (error) {
      console.error('[FareCalculationService] ERROR - 距离计算失败:', error)
      throw new BadRequestException('距离计算失败，请稍后重试')
    }

    // 3. 为每辆车计算运费
    const results: FareCalculationResult[] = []
    let successCount = 0
    let failCount = 0

    for (const vehicleId of vehicleIds) {
      try {
        const fareResult = await this.calculateFare(vehicleId, distance)

        // 4. 添加路线信息
        results.push({
          ...fareResult,
          route_type: routeType,
          is_estimate: isEstimate,
          route_duration: routeDuration
        })

        successCount++
      } catch (error) {
        failCount++
        console.error(`[FareCalculationService] WARN - 车辆 ${vehicleId} 运费计算失败:`, error)
      }
    }

    if (successCount === 0) {
      console.error('[FareCalculationService] ERROR - 所有车辆运费计算失败')
      throw new BadRequestException('所有车辆运费计算失败')
    }

    console.log(
      `[FareCalculationService] INFO - 多车辆运费计算完成: ` +
      `success=${successCount}, fail=${failCount}, total=${vehicleIds.length}`
    )

    return results
  }
}
