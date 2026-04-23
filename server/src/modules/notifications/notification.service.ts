import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export interface CreateNotificationDto {
  userId: string
  type: string
  title: string
  content: string
  relatedOrderId?: string
  relatedDemandId?: string
}

@Injectable()
export class NotificationsService {
  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, type, title, content, relatedOrderId, relatedDemandId } = createNotificationDto

    const client = getSupabaseClient()

    // 验证用户是否存在
    const { data: user, error: userError } = await client
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      throw new BadRequestException('用户不存在')
    }

    // 创建通知
    const { data: notification, error: insertError } = await client
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        related_order_id: relatedOrderId || null,
        related_demand_id: relatedDemandId || null,
        is_read: false
      })
      .select()
      .single()

    if (insertError) {
      throw new BadRequestException(`创建通知失败: ${insertError.message}`)
    }

    return {
      code: 200,
      message: '通知创建成功',
      data: notification
    }
  }

  async findByUserId(userId: string, unreadOnly: boolean = false) {
    const client = getSupabaseClient()

    let query = client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new BadRequestException(`查询通知失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: notifications || []
    }
  }

  async markAsRead(id: string, userId: string) {
    const client = getSupabaseClient()

    // 检查通知是否存在
    const { data: notification, error: checkError } = await client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError || !notification) {
      throw new NotFoundException('通知不存在')
    }

    // 更新为已读
    const { data: updated, error: updateError } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '已标记为已读',
      data: updated
    }
  }

  async markAllAsRead(userId: string) {
    const client = getSupabaseClient()

    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new BadRequestException(`批量标记失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '已全部标记为已读',
      data: null
    }
  }

  async getUnreadCount(userId: string) {
    const client = getSupabaseClient()

    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: { unreadCount: count || 0 }
    }
  }
}
