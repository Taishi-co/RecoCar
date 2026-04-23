import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { UpdateSettingsDto } from './dto/platform.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { S3Storage } from 'coze-coding-dev-sdk'

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
})

@Injectable()
export class PlatformService {
  // 获取平台配置
  async getSettings() {
    const client = getSupabaseClient()

    const { data: settings, error } = await client
      .from('platform_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: settings
    }
  }

  // 更新平台配置（管理员）
  async updateSettings(updateSettingsDto: UpdateSettingsDto) {
    const client = getSupabaseClient()

    const { data: existingSettings, error: checkError } = await client
      .from('platform_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    if (checkError) {
      throw new BadRequestException(`查询失败: ${checkError.message}`)
    }

    if (!existingSettings) {
      throw new NotFoundException('平台配置不存在')
    }

    // 更新配置
    const { data: settings, error: updateError } = await client
      .from('platform_settings')
      .update({
        commission_rate: updateSettingsDto.commissionRate,
        commission_payment_qr: updateSettingsDto.commissionPaymentQr,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'default')
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '更新成功',
      data: settings
    }
  }

  // 获取平台收款码签名URL
  async getPlatformPaymentQr() {
    const client = getSupabaseClient()

    const { data: settings, error } = await client
      .from('platform_settings')
      .select('commission_payment_qr')
      .eq('id', 'default')
      .single()

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    if (!settings?.commission_payment_qr) {
      throw new NotFoundException('平台收款码未设置')
    }

    // 生成签名URL
    try {
      const url = await storage.generatePresignedUrl({
        key: settings.commission_payment_qr,
        expireTime: 86400
      })

      return {
        code: 200,
        message: '查询成功',
        data: { paymentQr: url }
      }
    } catch (err) {
      console.error('[PlatformService] 生成平台收款码URL失败:', err)
      throw new BadRequestException('生成收款码URL失败')
    }
  }
}
