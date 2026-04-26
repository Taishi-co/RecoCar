import { Module } from '@nestjs/common'
import { AccountSettingsController } from './account-settings.controller'
import { AccountSettingsService } from './account-settings.service'

@Module({
  imports: [],
  controllers: [AccountSettingsController],
  providers: [AccountSettingsService],
  exports: [AccountSettingsService],
})
export class AccountSettingsModule {}
