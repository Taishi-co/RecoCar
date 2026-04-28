import { Injectable, NotFoundException } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StationService {
  /**
   * 创建奶站
   */
  async createStation(data: {
    enterpriseId: string;
    name: string;
    address: string;
    location?: { lat: number; lng: number };
    phone?: string;
  }) {
    const supabase = getSupabaseClient();
    const stationId = `station-${uuidv4().split('-')[0]}`; // 生成简短的ID
    
    const { data: station, error } = await supabase
      .from('dairy_stations')
      .insert({
        id: stationId,
        enterprise_id: data.enterpriseId,
        name: data.name,
        address: data.address,
        location: data.location,
        phone: data.phone,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return station;
  }

  /**
   * 获取奶站列表
   */
  async getStations(params: {
    enterpriseId: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) {
    const { enterpriseId, page = 1, pageSize = 20, keyword } = params;
    const from = (page - 1) * pageSize;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('dairy_stations')
      .select('*', { count: 'exact' })
      .eq('enterprise_id', enterpriseId);

    // 只在 keyword 存在且非空时添加搜索条件
    if (keyword && keyword.trim()) {
      query = query.or(`name.ilike.%${keyword}%,address.ilike.%${keyword}%`);
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
   * 获取奶站详情
   */
  async getStationById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dairy_stations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('奶站不存在');
      }
      throw error;
    }
    return data;
  }

  /**
   * 更新奶站信息
   */
  async updateStation(id: string, data: Partial<{
    name: string;
    address: string;
    location: { lat: number; lng: number };
    phone: string;
    status: string;
  }>) {
    const supabase = getSupabaseClient();
    const { data: station, error } = await supabase
      .from('dairy_stations')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('奶站不存在');
      }
      throw error;
    }
    return station;
  }

  /**
   * 删除奶站
   */
  async deleteStation(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('dairy_stations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: '删除成功' };
  }
}
