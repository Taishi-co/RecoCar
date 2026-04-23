import { Module } from '@nestjs/common'
import { DemandsService } from './demands.service'
import { DemandsController } from './demands.controller'
import { NotificationsModule } from '../notifications/notification.module'

@Module({
  imports: [NotificationsModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService]
})
export class DemandsModule {}
