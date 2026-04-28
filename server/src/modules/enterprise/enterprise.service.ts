import { Injectable } from '@nestjs/common';
import { enterprises, dairyStations, enterpriseDemands } from '../../storage/database/shared/schema';
import { db } from '../../storage/database';
import { eq, and, gte, sql } from 'drizzle-orm';

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
    const result = await db
      .insert(enterprises)
      .values({
        name: data.name,
        type: data.type,
        adminId: data.adminId,
        status: 'active',
      })
      .returning();
    return result[0];
  }

  /**
   * 获取企业信息
   */
  async getEnterpriseById(id: string) {
    const result = await db.select().from(enterprises).where(eq(enterprises.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * 根据管理员获取企业
   */
  async getEnterpriseByAdminId(adminId: string) {
    const result = await db
      .select()
      .from(enterprises)
      .where(eq(enterprises.adminId, adminId))
      .limit(1);
    return result[0] || null;
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
    const result = await db
      .update(enterprises)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(enterprises.id, id))
      .returning();
    return result[0];
  }

  /**
   * 获取企业统计信息
   */
  async getEnterpriseStats(enterpriseId: string) {
    // 获取奶站数量
    const stationsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dairyStations)
      .where(eq(dairyStations.enterpriseId, enterpriseId));

    // 获取今日待发订单
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pendingResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseDemands)
      .where(
        and(
          eq(enterpriseDemands.enterpriseId, enterpriseId),
          eq(enterpriseDemands.status, 'pending'),
          gte(enterpriseDemands.createdAt, today)
        )
      );

    // 获取进行中订单
    const inTransitResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseDemands)
      .where(
        and(
          eq(enterpriseDemands.enterpriseId, enterpriseId),
          eq(enterpriseDemands.status, 'in_transit')
        )
      );

    // 获取已完成订单（今天）
    const completedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseDemands)
      .where(
        and(
          eq(enterpriseDemands.enterpriseId, enterpriseId),
          eq(enterpriseDemands.status, 'completed'),
          gte(enterpriseDemands.createdAt, today)
        )
      );

    return {
      stationCount: stationsResult[0]?.count || 0,
      pendingOrders: pendingResult[0]?.count || 0,
      inTransitOrders: inTransitResult[0]?.count || 0,
      completedOrders: completedResult[0]?.count || 0,
    };
  }
}
