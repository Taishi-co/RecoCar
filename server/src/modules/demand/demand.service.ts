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

  /**
   * 获取企业需求统计
   */
  async getEnterpriseDemandStats(enterpriseId: string) {
    const supabase = getSupabaseClient();

    const { data: demands, error } = await supabase
      .from('enterprise_demands')
      .select('status')
      .eq('enterprise_id', enterpriseId);

    if (error) throw error;

    const stats = {
      pending: demands?.filter(d => d.status === 'pending').length || 0,
      in_transit: demands?.filter(d => d.status === 'in_transit').length || 0,
      completed: demands?.filter(d => d.status === 'completed').length || 0,
      cancelled: demands?.filter(d => d.status === 'cancelled').length || 0,
      total: demands?.length || 0,
    };

    return stats;
  }

  /**
   * 分配车辆到配送需求
   */
  async allocateVehicleToDemand(demandId: string, vehicleAllocation: any) {
    const supabase = getSupabaseClient();

    const { data: demand, error: updateError } = await supabase
      .from('enterprise_demands')
      .update({
        vehicle_allocation: vehicleAllocation,
        status: 'in_transit',
        updated_at: new Date().toISOString(),
      })
      .eq('id', demandId)
      .select()
      .single();

    if (updateError) throw updateError;
    return demand;
  }

  /**
   * 获取待调度外部订单
   */
  async getPendingExternalDemands() {
    const supabase = getSupabaseClient();

    const { data: demands, error } = await supabase
      .from('demands')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return demands || [];
  }

  /**
   * 企业接外部订单
   */
  async acceptExternalDemand(demandId: string, enterpriseId: string, vehicleIds: string[]) {
    const supabase = getSupabaseClient();

    // 获取外部订单
    const { data: externalDemand, error: fetchError } = await supabase
      .from('demands')
      .select('*')
      .eq('id', demandId)
      .single();

    if (fetchError || !externalDemand) {
      throw new Error('外部需求不存在');
    }

    // 创建企业需求
    const { data: enterpriseDemand, error: insertError } = await supabase
      .from('enterprise_demands')
      .insert({
        enterprise_id: enterpriseId,
        pickup_point_type: 'warehouse',
        pickup_point_info: {
          name: externalDemand.pickup_point?.name || '起点',
          address: externalDemand.pickup_point?.address || '',
        },
        delivery_points: externalDemand.delivery_points || [],
        cargo_info: externalDemand.cargo_info || {},
        time_window: {
          start: externalDemand.pickup_time_start,
          end: externalDemand.pickup_time_end,
        },
        vehicle_source: 'internal',
        status: 'in_transit',
        vehicle_allocation: {
          vehicle_ids: vehicleIds,
          allocated_at: new Date().toISOString(),
        },
        external_demand_id: demandId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 更新外部需求状态
    await supabase
      .from('demands')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', demandId);

    return enterpriseDemand;
  }
}
