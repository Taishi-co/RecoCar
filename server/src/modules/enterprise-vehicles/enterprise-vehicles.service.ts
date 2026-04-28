import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class EnterpriseVehiclesService {
  /**
   * 获取企业车辆列表
   */
  async getEnterpriseVehicles(enterpriseId: string) {
    const client = getSupabaseClient();
    
    const { data: vehicles, error } = await client
      .from('vehicles')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`);
    }

    return vehicles || [];
  }

  /**
   * 创建企业车辆
   */
  async createEnterpriseVehicle(enterpriseId: string, vehicleData: {
    vehicle_code: string;
    vehicle_type: string;
    license_plate: string;
    load_capacity: number;
    volume: number;
    current_location: string;
    usage_mode: 'internal' | 'external' | 'both';
  }) {
    const client = getSupabaseClient();

    // 验证企业是否存在
    const { data: enterprise, error: enterpriseError } = await client
      .from('enterprises')
      .select('id')
      .eq('id', enterpriseId)
      .maybeSingle();

    if (enterpriseError || !enterprise) {
      throw new NotFoundException('企业不存在');
    }

    // 创建车辆
    const { data: vehicle, error: insertError } = await client
      .from('vehicles')
      .insert({
        enterprise_id: enterpriseId,
        vehicle_code: vehicleData.vehicle_code,
        vehicle_type: vehicleData.vehicle_type,
        license_plate: vehicleData.vehicle_code, // 使用编码作为车牌
        load_capacity: vehicleData.load_capacity,
        volume: vehicleData.volume,
        current_location: vehicleData.current_location,
        usage_mode: vehicleData.usage_mode,
        trip_status: 'idle',
        status: 'active', // 企业车辆直接激活，无需审核
        battery_life: 100,
        has_cold_chain: true, // 奶制品配送默认需要冷链
        base_price: 20,
        base_distance: 3,
        price_per_km: 2,
        today_internal_orders: 0,
        today_external_orders: 0,
        today_distance: 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new BadRequestException(`创建车辆失败: ${insertError.message}`);
    }

    return vehicle;
  }

  /**
   * 更新车辆使用模式
   */
  async updateVehicleUsageMode(vehicleId: string, usageMode: 'internal' | 'external' | 'both') {
    const client = getSupabaseClient();

    const { data: vehicle, error } = await client
      .from('vehicles')
      .update({ usage_mode: usageMode })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`更新失败: ${error.message}`);
    }

    return vehicle;
  }

  /**
   * 获取企业车辆统计
   */
  async getEnterpriseVehicleStats(enterpriseId: string) {
    const client = getSupabaseClient();

    const { data: vehicles, error } = await client
      .from('vehicles')
      .select('usage_mode, trip_status')
      .eq('enterprise_id', enterpriseId);

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`);
    }

    const stats = {
      total: vehicles?.length || 0,
      in_transit: vehicles?.filter(v => v.trip_status === 'in_transit').length || 0,
      idle: vehicles?.filter(v => v.trip_status === 'idle').length || 0,
      internal: vehicles?.filter(v => v.usage_mode === 'internal').length || 0,
      external: vehicles?.filter(v => v.usage_mode === 'external' || v.usage_mode === 'both').length || 0,
      both: vehicles?.filter(v => v.usage_mode === 'both').length || 0,
    };

    return stats;
  }

  /**
   * 更新车辆今日统计
   */
  async updateVehicleTodayStats(
    vehicleId: string,
    stats: {
      internal_orders?: number;
      external_orders?: number;
      distance?: number;
    }
  ) {
    const client = getSupabaseClient();

    const { error } = await client
      .from('vehicles')
      .update({
        today_internal_orders: stats.internal_orders,
        today_external_orders: stats.external_orders,
        today_distance: stats.distance,
      })
      .eq('id', vehicleId);

    if (error) {
      throw new BadRequestException(`更新失败: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * 根据ID获取车辆
   */
  async getVehicleById(vehicleId: string) {
    const client = getSupabaseClient();

    const { data: vehicle, error } = await client
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`);
    }

    return vehicle;
  }

  /**
   * 更新车辆状态
   */
  async updateVehicleStatus(
    vehicleId: string,
    tripStatus: 'idle' | 'in_transit' | 'maintenance',
  ) {
    const client = getSupabaseClient();

    const { data: vehicle, error } = await client
      .from('vehicles')
      .update({ trip_status: tripStatus })
      .eq('id', vehicleId)
      .select()
      .maybeSingle();

    if (error) {
      throw new BadRequestException(`更新失败: ${error.message}`);
    }

    return vehicle;
  }

  /**
   * 删除车辆
   */
  async deleteVehicle(vehicleId: string) {
    const client = getSupabaseClient();

    const { error } = await client
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      throw new BadRequestException(`删除失败: ${error.message}`);
    }

    return true;
  }
}
