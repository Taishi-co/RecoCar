import { Injectable, NotFoundException } from '@nestjs/common';
import { dairyStations } from '../../storage/database/shared/schema';
import { db } from '../../storage/database';
import { eq, like, sql } from 'drizzle-orm';

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
    const result = await db
      .insert(dairyStations)
      .values({
        ...data,
        status: 'active',
      })
      .returning();
    return result[0];
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
    const offset = (page - 1) * pageSize;

    let query = db.select().from(dairyStations).where(eq(dairyStations.enterpriseId, enterpriseId));

    if (keyword) {
      query = query.where(
        sql`${dairyStations.name} LIKE ${`%${keyword}%`} OR ${dairyStations.address} LIKE ${`%${keyword}%`}`
      );
    }

    const stations = await query.limit(pageSize).offset(offset).orderBy(dairyStations.createdAt);

    // 获取总数
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dairyStations)
      .where(eq(dairyStations.enterpriseId, enterpriseId));

    return {
      list: stations,
      total: countResult[0]?.count || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取奶站详情
   */
  async getStationById(id: string) {
    const result = await db.select().from(dairyStations).where(eq(dairyStations.id, id)).limit(1);
    if (!result[0]) {
      throw new NotFoundException('奶站不存在');
    }
    return result[0];
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
    const result = await db
      .update(dairyStations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dairyStations.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundException('奶站不存在');
    }
    return result[0];
  }

  /**
   * 删除奶站
   */
  async deleteStation(id: string) {
    const result = await db
      .delete(dairyStations)
      .where(eq(dairyStations.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundException('奶站不存在');
    }
    return { message: '删除成功' };
  }
}
