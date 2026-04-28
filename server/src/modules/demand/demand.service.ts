import { Injectable } from '@nestjs/common';
import { enterpriseDemands } from '../../storage/database/shared/schema';
import { db } from '../../storage/database';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

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
    const result = await db
      .insert(enterpriseDemands)
      .values({
        ...data,
        status: 'pending',
      })
      .returning();
    return result[0];
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
    const offset = (page - 1) * pageSize;

    let query = db.select().from(enterpriseDemands).where(eq(enterpriseDemands.enterpriseId, enterpriseId));

    if (status) {
      query = query.where(eq(enterpriseDemands.status, status));
    }

    const demands = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(enterpriseDemands.createdAt));

    // 获取总数
    let countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseDemands)
      .where(eq(enterpriseDemands.enterpriseId, enterpriseId));

    if (status) {
      countQuery = countQuery.where(eq(enterpriseDemands.status, status));
    }

    const countResult = await countQuery;

    return {
      list: demands,
      total: countResult[0]?.count || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取配送需求详情
   */
  async getDemandById(id: string) {
    const result = await db.select().from(enterpriseDemands).where(eq(enterpriseDemands.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * 更新配送需求
   */
  async updateDemand(id: string, data: Partial<{
    vehicleAllocation: any;
    optimizedRoutes: any;
    status: string;
  }>) {
    const result = await db
      .update(enterpriseDemands)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(enterpriseDemands.id, id))
      .returning();
    return result[0];
  }

  /**
   * 获取待调度订单
   */
  async getPendingDemands(enterpriseId: string) {
    const result = await db
      .select()
      .from(enterpriseDemands)
      .where(
        and(
          eq(enterpriseDemands.enterpriseId, enterpriseId),
          eq(enterpriseDemands.status, 'pending')
        )
      )
      .orderBy(enterpriseDemands.createdAt);
    return result;
  }
}
