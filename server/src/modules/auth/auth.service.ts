import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { RegisterDto, LoginDto } from './dto/auth.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { UserInfo } from './auth.types'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AuthService {
  async register(registerDto: RegisterDto) {
    const { phone, password, name, role } = registerDto

    // 检查手机号是否已注册
    const client = getSupabaseClient()
    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (checkError) {
      throw new UnauthorizedException(`查询失败: ${checkError.message}`)
    }

    if (existingUser) {
      throw new ConflictException('该手机号已注册')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const userId = uuidv4()
    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        id: userId,
        phone,
        password: hashedPassword,
        role,
        name,
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      throw new UnauthorizedException(`注册失败: ${insertError.message}`)
    }

    // 生成 token（简化版，使用用户ID）
    const token = userId

    // 返回用户信息（不包含密码）
    const userInfo: UserInfo = {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      role: newUser.role,
      token
    }

    return {
      code: 200,
      message: '注册成功',
      data: userInfo
    }
  }

  async login(loginDto: LoginDto) {
    const { phone, password } = loginDto

    // 查询用户
    const client = getSupabaseClient()
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (error) {
      throw new UnauthorizedException(`查询失败: ${error.message}`)
    }

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误')
    }

    // 检查用户状态
    if (user.status === 'disabled') {
      throw new UnauthorizedException('账号已被禁用')
    }

    // 生成 token（简化版，使用用户ID）
    const token = user.id

    // 返回用户信息（不包含密码）
    const userInfo: UserInfo = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      token
    }

    return {
      code: 200,
      message: '登录成功',
      data: userInfo
    }
  }
}
