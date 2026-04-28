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

    // 获取奶站数量
    const { count: stationCount, error: stationError } = await supabase
      .from('dairy_stations')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId);

    // 获取今日待发订单
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: pendingCount, error: pendingError } = await supabase
      .from('enterprise_demands')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'pending')
      .gte('created_at', today.toISOString());

    // 获取进行中订单
    const { count: inTransitCount, error: inTransitError } = await supabase
      .from('enterprise_demands')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'in_transit');

    // 获取已完成订单（今天）
    const { count: completedCount, error: completedError } = await supabase
      .from('enterprise_demands')
      .select('*', { count: 'exact', head: true })
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'completed')
      .gte('created_at', today.toISOString());

    return {
      stationCount: stationCount || 0,
      pendingOrders: pendingCount || 0,
      inTransitOrders: inTransitCount || 0,
      completedOrders: completedCount || 0,
    };
  }
}
