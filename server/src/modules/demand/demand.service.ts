import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

@Injectable()
export class DemandService {
  /**
   * 创建配送需求
   */
  async createDemand(data: {
    enterpriseId: string;
    pickupPointType: string;
    pickupPointInfo: any;
    deliveryPoints: any[];
    cargoInfo: any;
    timeWindow: any;
    vehicleSource: string;
  }) {
    const supabase = getSupabaseClient();
    const { data: demand, error } = await supabase
      .from('enterprise_demands')
      .insert({
        enterprise_id: data.enterpriseId,
        pickup_point_type: data.pickupPointType,
        pickup_point_info: data.pickupPointInfo,
        delivery_points: data.deliveryPoints,
        cargo_info: data.cargoInfo,
        time_window: data.timeWindow,
        vehicle_source: data.vehicleSource,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return demand;
  }

  /**
   * 获取配送需求列表
   */
  async getDemands(params: {
    enterpriseId: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { enterpriseId, status, page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('enterprise_demands')
      .select('*', { count: 'exact' })
      .eq('enterprise_id', enterpriseId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      list: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取配送需求详情
   */
  async getDemandById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('enterprise_demands')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * 更新配送需求
   */
  async updateDemand(id: string, data: Partial<{
    vehicleAllocation: any;
    optimizedRoutes: any;
    status: string;
  }>) {
    const supabase = getSupabaseClient();
    const { data: demand, error } = await supabase
      .from('enterprise_demands')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return demand;
  }

  /**
   * 获取待调度订单
   */
  async getPendingDemands(enterpriseId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('enterprise_demands')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
