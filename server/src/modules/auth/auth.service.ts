import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { RegisterDto, LoginDto, UpdatePaymentQrDto } from './dto/auth.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { UserInfo } from './auth.types'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { S3Storage } from 'coze-coding-dev-sdk'

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
})

interface UploadedFile {
  buffer: Buffer
  originalname: string
  mimetype: string
}

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

  async getUserInfo(userId: string) {
    const client = getSupabaseClient()

    const { data: user, error } = await client
      .from('users')
      .select('id, phone, name, role, avatar, wechat_payment_qr, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: user
    }
  }

  async updatePaymentQr(updatePaymentQrDto: UpdatePaymentQrDto, file?: UploadedFile) {
    const { userId } = updatePaymentQrDto

    // 验证用户是否存在
    const client = getSupabaseClient()
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      throw new NotFoundException('用户不存在')
    }

    // 只有车主可以上传收款码
    if (user.role !== 'owner') {
      throw new BadRequestException('只有车主可以上传收款码')
    }

    if (!file) {
      throw new BadRequestException('请上传收款码图片')
    }

    // 上传图片到TOS
    let fileKey: string
    try {
      fileKey = await storage.uploadFile({
        fileContent: file.buffer,
        fileName: `payment_qr/${userId}_${Date.now()}_${file.originalname}`,
        contentType: file.mimetype,
      })
      console.log('[AuthService] 收款码上传成功:', fileKey)
    } catch (error) {
      console.error('[AuthService] 收款码上传失败:', error)
      throw new BadRequestException('收款码上传失败')
    }

    // 更新用户收款码
    const { data: updatedUser, error: updateError } = await client
      .from('users')
      .update({ wechat_payment_qr: fileKey })
      .eq('id', userId)
      .select('id, phone, name, role, wechat_payment_qr')
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '收款码上传成功',
      data: updatedUser
    }
  }
}
