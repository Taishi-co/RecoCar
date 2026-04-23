import { Module } from '@nestjs/common'
import { CancellationsController } from './cancellations.controller'
import { CancellationsService } from './cancellations.service'
import { NotificationsModule } from '../notifications/notification.module'

@Module({
  imports: [NotificationsModule],
  controllers: [CancellationsController],
  providers: [CancellationsService],
  exports: [CancellationsService]
})
export class CancellationsModule {}
