import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AccountSettingsService {
  private supabase = getSupabaseClient()

  /**
   * 获取用户个人信息
   */
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, phone, nickname, avatar_url, gender, birthday, role, avatar_url, name, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    if (!data) {
      console.error('User not found, userId:', userId)
      throw new BadRequestException('用户不存在')
    }

    return data
  }

  /**
   * 更新用户个人信息
   */
  async updateProfile(userId: string, updateData: any) {
    const { avatar_url, nickname, gender, birthday } = updateData

    const updateObj: any = { updated_at: new Date().toISOString() }
    if (avatar_url !== undefined) updateObj.avatar_url = avatar_url
    if (nickname !== undefined) updateObj.nickname = nickname
    if (gender !== undefined) updateObj.gender = gender
    if (birthday !== undefined) updateObj.birthday = birthday

    if (Object.keys(updateObj).length === 1) {
      throw new BadRequestException('没有需要更新的字段')
    }

    const { data, error } = await this.supabase
      .from('users')
      .update(updateObj)
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) {
      throw new BadRequestException('用户不存在')
    }

    return data
  }

  /**
   * 验证并绑定新手机号
   */
  async changePhone(userId: string, code: string, newPhone: string) {
    // 1. 验证验证码
    const { data: codeData, error: codeError } = await this.supabase
      .from('sms_codes')
      .select('*')
      .eq('phone', newPhone)
      .eq('code', code)
      .eq('is_used', false)
      .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (codeError || !codeData) {
      throw new BadRequestException('验证码无效或已过期')
    }

    // 2. 检查手机号是否已被使用
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('phone', newPhone)
      .neq('id', userId)
      .limit(1)
      .maybeSingle()

    if (existingUser) {
      throw new BadRequestException('该手机号已被使用')
    }

    // 3. 更新手机号
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ phone: newPhone, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      throw new BadRequestException('手机号修改失败')
    }

    // 4. 标记验证码已使用
    await this.supabase
      .from('sms_codes')
      .update({ is_used: true })
      .eq('id', codeData.id)

    return { message: '手机号修改成功' }
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 1. 获取用户信息
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .single()

    if (error || !user) {
      throw new BadRequestException('用户不存在')
    }

    // 2. 验证原密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new BadRequestException('原密码错误')
    }

    // 3. 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 4. 更新密码
    const { error: updateError } = await this.supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      throw new BadRequestException('密码修改失败')
    }

    return { message: '密码修改成功，请重新登录' }
  }

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phone: string, type: string) {
    // 1. 检查手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('手机号格式不正确')
    }

    // 2. 检查发送频率（1分钟内只能发送一次）
    const { data: recentCode, error: recentError } = await this.supabase
      .from('sms_codes')
      .select('created_at')
      .eq('phone', phone)
      .eq('type', type)
      .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle()

    if (recentError) {
      console.error('检查发送频率失败:', recentError)
    }

    if (recentCode) {
      throw new BadRequestException('发送过于频繁，请稍后再试')
    }

    // 3. 生成验证码（模拟）
    const code = Math.random().toString().slice(2, 8)

    // 4. 保存验证码
    const { error } = await this.supabase
      .from('sms_codes')
      .insert({
        phone,
        code,
        type,
        is_used: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('保存验证码失败:', error)
      throw new BadRequestException(`验证码发送失败: ${error.message}`)
    }

    // 5. 发送短信（实际项目中应该调用短信服务）
    console.log(`[SMS] 发送验证码到 ${phone}: ${code}`)

    return { message: '验证码已发送', code: code } // 开发环境返回验证码，生产环境应该移除
  }

  /**
   * 退出登录
   */
  async logout(userId: string) {
    // 清除用户的会话信息（如果使用 Redis 存储 token）
    // 这里只是示例，实际实现取决于你的认证方案

    return { message: '退出成功' }
  }
}
