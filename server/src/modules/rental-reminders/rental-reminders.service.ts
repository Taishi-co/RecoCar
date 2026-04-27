import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class RentalRemindersService {
  private client = getSupabaseClient()

  /**
   * 检查租赁到期情况并发送提醒
   */
  async checkRentalExpiry() {
    console.log('[RentalRemindersService] 开始检查租赁到期情况...')

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // 查询所有活跃的租赁关系
    const { data: activeRentals, error: rentalsError } = await this.client
      .from('vehicle_rentals')
      .select('*')
      .eq('status', 'active')

    if (rentalsError) {
      console.error('[RentalRemindersService] 查询租赁关系失败:', rentalsError)
      throw new Error(`查询租赁关系失败: ${rentalsError.message}`)
    }

    console.log(`[RentalRemindersService] 查询到 ${activeRentals?.length || 0} 条活跃租赁`)

    let reminderCount = 0

    for (const rental of activeRentals || []) {
      // 分别查询车辆和用户信息
      const { data: vehicle } = await this.client
        .from('vehicles')
        .select('*')
        .eq('id', rental.vehicle_id)
        .maybeSingle()

      const { data: owner } = await this.client
        .from('users')
        .select('*')
        .eq('id', rental.owner_id)
        .maybeSingle()

      const { data: renter } = await this.client
        .from('users')
        .select('*')
        .eq('id', rental.renter_id)
        .maybeSingle()

      if (!vehicle || !owner || !renter) {
        console.error(`[RentalRemindersService] 租赁ID ${rental.id} - 相关数据不完整，跳过`)
        continue
      }

      const rentEndDate = new Date(rental.rent_end_date)
      const daysUntilExpiry = Math.ceil((rentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`[RentalRemindersService] 租赁ID ${rental.id} - 剩余天数: ${daysUntilExpiry}, 到期日期: ${rentEndDate}`)

      // 检查是否需要发送提醒
      let shouldSendReminder = false
      let reminderType = ''

      if (daysUntilExpiry === 7) {
        shouldSendReminder = true
        reminderType = '7_days_before'
      } else if (daysUntilExpiry === 3) {
        shouldSendReminder = true
        reminderType = '3_days_before'
      } else if (daysUntilExpiry === 1) {
        shouldSendReminder = true
        reminderType = '1_day_before'
      } else if (daysUntilExpiry === 0) {
        shouldSendReminder = true
        reminderType = 'on_expiry_date'
      } else if (daysUntilExpiry < 0) {
        shouldSendReminder = true
        reminderType = 'overdue'
      }

      if (shouldSendReminder) {
        // 检查是否已经发送过该类型的提醒
        const { data: existingReminder } = await this.client
          .from('rental_reminders')
          .select('*')
          .eq('rental_id', rental.id)
          .eq('reminder_type', reminderType)
          .eq('is_sent', true)
          .maybeSingle()

        if (existingReminder) {
          console.log(`[RentalRemindersService] 租赁ID ${rental.id} - ${reminderType} 提醒已发送，跳过`)
          continue
        }

        // 发送提醒
        await this.sendReminder(rental, vehicle, owner, renter, reminderType, daysUntilExpiry)
        reminderCount++

        // 更新租赁的提醒计数和最后提醒时间
        await this.client
          .from('vehicle_rentals')
          .update({
            last_reminder_time: now.toISOString(),
            reminder_sent_count: (rental.reminder_sent_count || 0) + 1
          })
          .eq('id', rental.id)
      }
    }

    console.log(`[RentalRemindersService] 检查完成，共发送 ${reminderCount} 条提醒`)

    return {
      code: 200,
      message: '检查完成',
      data: {
        totalRentals: activeRentals?.length || 0,
        remindersSent: reminderCount
      }
    }
  }

  /**
   * 发送提醒
   */
  private async sendReminder(
    rental: any,
    vehicle: any,
    owner: any,
    renter: any,
    reminderType: string,
    daysUntilExpiry: number
  ) {
    console.log(`[RentalRemindersService] 发送提醒 - 租赁ID: ${rental.id}, 类型: ${reminderType}`)

    // 生成提醒内容
    const { ownerContent, renterContent } = this.generateReminderContent(vehicle, owner, renter, reminderType, daysUntilExpiry)

    // 创建站内消息（车主）
    await this.createSystemMessage(
      rental.owner_id,
      ownerContent.title,
      ownerContent.content,
      rental.id
    )

    // 创建站内消息（租户）
    await this.createSystemMessage(
      rental.renter_id,
      renterContent.title,
      renterContent.content,
      rental.id
    )

    // 记录提醒日志（站内消息）
    await this.logReminder(rental.id, rental.owner_id, rental.renter_id, reminderType, 'system', true)

    // TODO: 发送推送通知（第二阶段实现）
    // await this.sendPushNotification(rental, reminderType)

    console.log(`[RentalRemindersService] 提醒发送成功 - 租赁ID: ${rental.id}`)
  }

  /**
   * 生成提醒内容
   */
  private generateReminderContent(
    vehicle: any,
    owner: any,
    renter: any,
    reminderType: string,
    daysUntilExpiry: number
  ) {
    const licensePlate = vehicle?.license_plate || '未填写'
    const renterName = renter?.name || renter?.username || '未填写'
    const renterPhone = renter?.phone ? this.maskPhone(renter.phone) : ''
    const ownerName = owner?.name || owner?.username || '未填写'
    const ownerPhone = owner?.phone ? this.maskPhone(owner.phone) : ''
    const rentEndDate = renter.rent_end_date?.split('T')[0] || ''

    let ownerTitle = ''
    let ownerContent = ''
    let renterTitle = ''
    let renterContent = ''

    switch (reminderType) {
      case '7_days_before':
        ownerTitle = '租赁到期提醒'
        ownerContent = `您的车辆（车牌号：${licensePlate}）租赁将于7天后到期\n租户：${renterName}（${renterPhone}）\n到期时间：${rentEndDate}\n请及时与租户沟通续期或归还事宜`

        renterTitle = '租赁即将到期提醒'
        renterContent = `您租赁的车辆（车牌号：${licensePlate}）将于7天后到期\n车主：${ownerName}（${ownerPhone}）\n到期时间：${rentEndDate}\n如需续期请提前联系车主，如不续期请按时归还`
        break

      case '3_days_before':
        ownerTitle = '租赁即将到期（3天后）'
        ownerContent = `您的车辆（车牌号：${licensePlate}）租赁将于3天后到期\n租户：${renterName}（${renterPhone}）\n到期时间：${rentEndDate}\n请与租户确认是否续期，如不续期请提醒按时归还`

        renterTitle = '租赁即将到期（3天后）'
        renterContent = `您租赁的车辆（车牌号：${licensePlate}）将于3天后到期\n车主：${ownerName}（${ownerPhone}）\n到期时间：${rentEndDate}\n请尽快决定是否续期，如不续期请提前规划归还`
        break

      case '1_day_before':
        ownerTitle = '租赁即将到期（明天）'
        ownerContent = `您的车辆（车牌号：${licensePlate}）租赁将于明天到期！\n租户：${renterName}（${renterPhone}）\n到期时间：${rentEndDate}\n请务必与租户确认续期或归还事宜，避免逾期`

        renterTitle = '租赁即将到期（明天）'
        renterContent = `您租赁的车辆（车牌号：${licensePlate}）将于明天到期！\n车主：${ownerName}（${ownerPhone}）\n到期时间：${rentEndDate}\n请立即与车主确认续期或归还事宜`
        break

      case 'on_expiry_date':
        ownerTitle = '租赁今天到期！'
        ownerContent = `您的车辆（车牌号：${licensePlate}）租赁今天到期！\n租户：${renterName}（${renterPhone}）\n到期时间：${rentEndDate}\n如不续期，请提醒租户立即归还车辆`

        renterTitle = '租赁今天到期！'
        renterContent = `您租赁的车辆（车牌号：${licensePlate}）今天到期！\n车主：${ownerName}（${ownerPhone}）\n到期时间：${rentEndDate}\n如不续期，请立即归还车辆，避免产生违约金`
        break

      case 'overdue':
        ownerTitle = '租赁已逾期！'
        ownerContent = `您的车辆（车牌号：${licensePlate}）租赁已逾期！\n租户：${renterName}（${renterPhone}）\n应归还时间：${rentEndDate}\n当前逾期天数：${Math.abs(daysUntilExpiry)}天\n请尽快与租户联系，处理车辆归还事宜`

        renterTitle = '租赁已逾期！请立即处理'
        renterContent = `您租赁的车辆（车牌号：${licensePlate}）已逾期！\n车主：${ownerName}（${ownerPhone}）\n应归还时间：${rentEndDate}\n当前逾期天数：${Math.abs(daysUntilExpiry)}天\n请立即联系车主续期或归还车辆，逾期可能产生违约金`
        break
    }

    return {
      ownerContent: { title: ownerTitle, content: ownerContent },
      renterContent: { title: renterTitle, content: renterContent }
    }
  }

  /**
   * 创建站内消息
   */
  private async createSystemMessage(
    userId: string,
    title: string,
    content: string,
    relatedId?: string
  ) {
    try {
      const { error } = await this.client
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'rental_reminder',
          title,
          content,
          related_type: 'vehicle_rental',
          related_id: relatedId,
          is_read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('[RentalRemindersService] 创建站内消息失败:', error)
      }
    } catch (error) {
      console.error('[RentalRemindersService] 创建站内消息异常:', error)
    }
  }

  /**
   * 记录提醒日志
   */
  private async logReminder(
    rentalId: string,
    ownerId: string,
    renterId: string,
    reminderType: string,
    channel: string,
    isSent: boolean,
    errorMessage?: string
  ) {
    try {
      await this.client
        .from('rental_reminders')
        .insert({
          rental_id: rentalId,
          owner_id: ownerId,
          renter_id: renterId,
          reminder_type: reminderType,
          reminder_channel: channel,
          is_sent: isSent,
          sent_at: new Date().toISOString(),
          sent_status: isSent ? 'success' : 'failed',
          error_message: errorMessage,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('[RentalRemindersService] 记录提醒日志失败:', error)
    }
  }

  /**
   * 手机号脱敏
   */
  private maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
  }

  /**
   * 创建违约记录
   */
  async createViolationRecord(
    rentalId: string,
    userId: string,
    violationType: string,
    overdueDays: number,
    penaltyAmount: number
  ) {
    try {
      const { data, error } = await this.client
        .from('rental_violations')
        .insert({
          rental_id: rentalId,
          user_id: userId,
          violation_type: violationType,
          overdue_days: overdueDays,
          penalty_amount: penaltyAmount,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`创建违约记录失败: ${error.message}`)
      }

      console.log('[RentalRemindersService] 创建违约记录成功:', data)

      return {
        code: 200,
        message: '创建违约记录成功',
        data
      }
    } catch (error) {
      console.error('[RentalRemindersService] 创建违约记录失败:', error)
      throw error
    }
  }
}
