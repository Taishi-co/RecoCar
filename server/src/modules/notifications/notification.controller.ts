import { Controller, Get, Post, Put, Body, Query, Param } from '@nestjs/common'
import { NotificationsService } from './notification.service'
import { CreateNotificationDto } from './dto/notification.dto'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    console.log('[NotificationsController] 创建通知:', createNotificationDto)
    return this.notificationsService.create(createNotificationDto)
  }

  @Get()
  async getNotifications(
    @Query('user_id') userId: string,
    @Query('unread_only') unreadOnly?: string
  ) {
    return this.notificationsService.findByUserId(
      userId,
      unreadOnly === 'true'
    )
  }

  @Get('unread-count')
  async getUnreadCount(@Query('user_id') userId: string) {
    return this.notificationsService.getUnreadCount(userId)
  }

  @Put(':id/mark-read')
  async markAsRead(
    @Param('id') id: string,
    @Body('user_id') userId: string
  ) {
    console.log('[NotificationsController] 标记为已读:', id)
    return this.notificationsService.markAsRead(id, userId)
  }

  @Put('mark-all-read')
  async markAllAsRead(@Body('user_id') userId: string) {
    console.log('[NotificationsController] 标记所有为已读:', userId)
    return this.notificationsService.markAllAsRead(userId)
  }
}
