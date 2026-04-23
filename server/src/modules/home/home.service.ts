import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class HomeService {
  // 脱敏函数：手机号
  private maskPhone(phone: string): string {
    if (!phone || phone.length < 11) return phone
    return phone.substring(0, 3) + '****' + phone.substring(7)
  }

  // 脱敏函数：地址
  private maskAddress(address: string): string {
    if (!address) return address
    if (address.length <= 6) return '***'
    return address.substring(0, 6) + '***'
  }

  // 脱敏函数：车牌号
  private maskLicensePlate(plate: string): string {
    if (!plate || plate.length < 7) return plate
    return plate.substring(0, 2) + '****'
  }

  // 获取首页最新信息（需求/车辆/完单）
  async getLatestInfo() {
    const client = getSupabaseClient()

    // 查询最新需求（待接单）
    const { data: latestDemands, error: demandsError } = await client
      .from('demands')
      .select(`
        id,
        cargo_name,
        cargo_type,
        pickup_address,
        merchant_id
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    // 查询可用车辆（激活状态）
    const { data: availableVehicles, error: vehiclesError } = await client
      .from('vehicles')
      .select(`
        id,
        vehicle_type,
        license_plate,
        owner_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)

    // 查询完单信息
    const { data: completedOrders, error: ordersError } = await client
      .from('orders')
      .select(`
        id,
        fare_price,
        actual_complete_time,
        owner_id,
        demands!inner (
          cargo_name
        )
      `)
      .eq('status', 'completed')
      .not('actual_complete_time', 'is', null)
      .order('actual_complete_time', { ascending: false })
      .limit(5)

    // 获取用户信息（用于脱敏）
    const merchantIds = latestDemands?.map(d => d.merchant_id).filter(Boolean) || []
    const vehicleOwnerIds = availableVehicles?.map(v => v.owner_id).filter(Boolean) || []
    const orderOwnerIds = completedOrders?.map(o => o.owner_id).filter(Boolean) || []

    const allUserIds = [...new Set([...merchantIds, ...vehicleOwnerIds, ...orderOwnerIds])]

    const { data: users, error: usersError } = allUserIds.length > 0
      ? await client
          .from('users')
          .select('id, phone')
          .in('id', allUserIds)
      : { data: [], error: null }

    // 创建用户映射
    const userMap = new Map<string, string>()
    if (users) {
      users.forEach((u: any) => {
        userMap.set(u.id, u.phone)
      })
    }

    // 脱敏处理最新需求
    const maskedDemands = latestDemands?.map((demand: any) => {
      const merchantPhone: string | undefined = userMap.get(demand.merchant_id) as string | undefined
      return {
        id: demand.id,
        cargoName: demand.cargo_name,
        cargoType: demand.cargo_type,
        pickupAddress: this.maskAddress(demand.pickup_address),
        merchantPhone: this.maskPhone(merchantPhone || ''),
        createdAt: demand.created_at
      }
    }) || []

    // 脱敏处理可用车辆
    const maskedVehicles = availableVehicles?.map((vehicle: any) => {
      const ownerPhone: string | undefined = userMap.get(vehicle.owner_id) as string | undefined
      return {
        id: vehicle.id,
        vehicleType: vehicle.vehicle_type,
        licensePlate: this.maskLicensePlate(vehicle.license_plate),
        ownerPhone: this.maskPhone(ownerPhone || ''),
        status: 'active',
        createdAt: vehicle.created_at
      }
    }) || []

    // 脱敏处理完单信息
    const maskedOrders = completedOrders?.map((order: any) => {
      const ownerPhone: string | undefined = userMap.get(order.owner_id) as string | undefined
      return {
        id: order.id,
        cargoName: (order.demands as any)?.cargo_name || '',
        ownerPhone: this.maskPhone(ownerPhone || ''),
        farePrice: order.fare_price,
        completedTime: order.actual_complete_time
      }
    }) || []

    return {
      code: 200,
      message: '查询成功',
      data: {
        latestDemands: maskedDemands,
        availableVehicles: maskedVehicles,
        completedOrders: maskedOrders
      }
    }
  }

  // 获取首页统计数据
  async getStatistics() {
    const client = getSupabaseClient()

    // 查询订单总数（按状态分类）
    const { data: ordersByStatus, error: ordersError } = await client
      .from('orders')
      .select('status')

    // 查询车辆总数
    const { data: vehiclesData, error: vehiclesError } = await client
      .from('vehicles')
      .select('status')

    // 查询需求总数
    const { data: demandsData, error: demandsError } = await client
      .from('demands')
      .select('status')

    // 查询最近完成的订单（展示用）
    const { data: recentCompletedOrders, error: recentError } = await client
      .from('orders')
      .select(`
        id,
        fare_price,
        commission_amount,
        actual_complete_time,
        demands (
          cargo_name,
          pickup_address,
          delivery_address
        ),
        users!inner (
          name
        )
      `)
      .eq('status', 'completed')
      .not('actual_complete_time', 'is', null)
      .order('actual_complete_time', { ascending: false })
      .limit(5)

    if (ordersError || vehiclesError || demandsError || recentError) {
      console.error('[HomeService] 查询统计数据失败:', {
        ordersError,
        vehiclesError,
        demandsError,
        recentError
      })
      // 不抛出异常，返回默认数据
    }

    // 统计数据
    const stats = {
      orders: {
        total: ordersByStatus?.length || 0,
        completed: ordersByStatus?.filter(o => o.status === 'completed').length || 0,
        in_transit: ordersByStatus?.filter(o => o.status === 'in_transit').length || 0
      },
      vehicles: {
        total: vehiclesData?.length || 0,
        active: vehiclesData?.filter(v => v.status === 'active').length || 0
      },
      demands: {
        total: demandsData?.length || 0,
        pending: demandsData?.filter(d => d.status === 'pending').length || 0
      },
      recentOrders: recentCompletedOrders?.map((order: any) => ({
        id: order.id,
        cargoName: (order.demands as any)?.[0]?.cargo_name || '',
        ownerName: (order.users as any)?.[0]?.name || '',
        farePrice: order.fare_price,
        completeTime: order.actual_complete_time
      })) || []
    }

    return {
      code: 200,
      message: '查询成功',
      data: stats
    }
  }
}
