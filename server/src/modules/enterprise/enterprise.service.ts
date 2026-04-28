import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

@Injectable()
export class EnterpriseService {
  /**
   * 创建企业
   */
  async createEnterprise(data: {
    name: string;
    type: string;
    adminId: string;
  }) {
    const supabase = getSupabaseClient();
    const { data: enterprise, error } = await supabase
      .from('enterprises')
      .insert({
        name: data.name,
        type: data.type,
        admin_id: data.adminId,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return enterprise;
  }

  /**
   * 获取企业信息
   */
  async getEnterpriseById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * 根据管理员获取企业
   */
  async getEnterpriseByAdminId(adminId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('enterprises')
      .select('*')
      .eq('admin_id', adminId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * 更新企业信息
   */
  async updateEnterprise(id: string, data: Partial<{
    name: string;
    type: string;
    adminId: string;
    status: string;
  }>) {
    const supabase = getSupabaseClient();
    const { data: enterprise, error } = await supabase
      .from('enterprises')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return enterprise;
  }

  /**
   * 获取企业统计信息
   */
  async getEnterpriseStats(enterpriseId: string) {
    const supabase = getSupabaseClient();

    // 获取今日订单统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayDemands } = await supabase
      .from('enterprise_demands')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', today.toISOString());

    const todayOrders = (todayDemands || []).length;

    // 获取本月订单统计
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: monthCount } = await supabase
      .from('enterprise_demands')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId)
      .gte('created_at', monthStart.toISOString());

    const monthOrders = monthCount || 0;

    // 获取车辆统计
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('enterprise_id', enterpriseId);

    const activeVehicles = (vehicles || []).filter(v => v.trip_status === 'in_transit').length;
    const totalVehicles = (vehicles || []).length;
    const vehicleUsageRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    // 计算总配送距离（从车辆统计）
    const totalDistance = (vehicles || []).reduce((sum, v) => sum + (v.today_distance || 0), 0);

    // 平均配送时间（模拟数据，实际需要从订单记录中计算）
    const avgDeliveryTime = 45;

    // 奶站配送统计
    const { data: stations } = await supabase
      .from('dairy_stations')
      .select('*')
      .eq('enterprise_id', enterpriseId);

    const stationStats = (stations || []).map(station => {
      const stationOrders = (todayDemands || []).filter(demand => {
        return demand.delivery_points && demand.delivery_points.some(
          point => point.name === station.station_name
        );
      }).length;

      return {
        stationName: station.station_name,
        orderCount: stationOrders,
      };
    }).filter(stat => stat.orderCount > 0);

    return {
      todayOrders,
      monthOrders,
      totalDistance,
      avgDeliveryTime,
      vehicleUsageRate,
      activeVehicles,
      totalVehicles,
      stationStats,
    };
  }
}
