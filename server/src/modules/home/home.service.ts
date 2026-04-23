import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class HomeService {
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
