import { Controller, Get, Put, Post, Body, UseGuards, Request, Req } from '@nestjs/common'
import { AccountSettingsService } from './account-settings.service'
import { UpdateProfileDto, ChangePhoneDto, ChangePasswordDto, SendSmsCodeDto } from './dto/account-settings.dto'

@Controller('account-settings')
export class AccountSettingsController {
  constructor(private readonly accountSettingsService: AccountSettingsService) {}

  /**
   * 获取用户个人信息
   */
  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req?.user?.id || req?.body?.user_id || '7428999e-92fa-4fec-9f75-09087edbf244'
    const profile = await this.accountSettingsService.getProfile(userId)

    return {
      code: 200,
      message: '获取成功',
      data: profile
    }
  }

  /**
   * 更新用户个人信息
   */
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req?.user?.id || req?.body?.user_id || '7428999e-92fa-4fec-9f75-09087edbf244'
    const profile = await this.accountSettingsService.updateProfile(userId, updateProfileDto)

    return {
      code: 200,
      message: '更新成功',
      data: profile
    }
  }

  /**
   * 发送短信验证码
   */
  @Post('send-sms-code')
  async sendSmsCode(@Body() sendSmsCodeDto: SendSmsCodeDto) {
    const result = await this.accountSettingsService.sendSmsCode(
      sendSmsCodeDto.phone,
      sendSmsCodeDto.type
    )

    return {
      code: 200,
      message: result.message,
      data: { code: result.code }
    }
  }

  /**
   * 修改手机号
   */
  @Post('change-phone')
  async changePhone(@Req() req: any, @Body() changePhoneDto: ChangePhoneDto) {
    const userId = req?.user?.id || req?.body?.user_id || '7428999e-92fa-4fec-9f75-09087edbf244'
    const result = await this.accountSettingsService.changePhone(
      userId,
      changePhoneDto.code,
      changePhoneDto.newPhone
    )

    return {
      code: 200,
      message: result.message
    }
  }

  /**
   * 修改密码
   */
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req?.user?.id || req?.body?.user_id || '7428999e-92fa-4fec-9f75-09087edbf244'
    const result = await this.accountSettingsService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword
    )

    return {
      code: 200,
      message: result.message
    }
  }

  /**
   * 退出登录
   */
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req?.user?.id || req?.body?.user_id || '7428999e-92fa-4fec-9f75-09087edbf244'
    const result = await this.accountSettingsService.logout(userId)

    return {
      code: 200,
      message: result.message
    }
  }
}
