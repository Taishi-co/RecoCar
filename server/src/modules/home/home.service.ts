import { Injectable, BadRequestException } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { S3Storage } from 'coze-coding-dev-sdk'

@Injectable()
export class HomeService {
  private storage: S3Storage

  constructor() {
    // 初始化对象存储
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  // 上传文件到对象存储
  async uploadFile(file: Express.Multer.File) {
    try {
      console.log('[HomeService] 开始上传文件:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      })

      if (!file || !file.buffer) {
        throw new BadRequestException('文件不能为空')
      }

      // 验证文件类型
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('不支持的文件类型，请上传图片文件')
      }

      // 验证文件大小（最大5MB）
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new BadRequestException('文件大小不能超过5MB')
      }

      // 生成文件名（使用时间戳和随机数）
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 15)
      const ext = file.originalname.split('.').pop()
      const fileName = `cargo-photos/${timestamp}-${random}.${ext}`

      console.log('[HomeService] 上传到对象存储:', fileName)

      // 上传到对象存储
      const fileKey = await this.storage.uploadFile({
        fileContent: file.buffer,
        fileName: fileName,
        contentType: file.mimetype
      })

      console.log('[HomeService] 上传成功，fileKey:', fileKey)

      // 生成可访问的URL
      const imageUrl = await this.storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 86400 // 24小时有效期
      })

      console.log('[HomeService] 生成URL成功:', imageUrl)

      return {
        code: 200,
        message: '上传成功',
        data: {
          fileKey: fileKey,
          url: imageUrl
        }
      }
    } catch (error) {
      console.error('[HomeService] 上传文件失败:', error)
      throw new BadRequestException(error.message || '上传失败')
    }
  }
  // 脱敏函数：手机号
  private maskPhone(phone: string): string {
    if (!phone || phone.length < 11) return phone
    return phone.substring(0, 3) + '****' + phone.substring(7)
  }

  // 脱敏函数：地址
  private maskAddress(address: string): string {
    if (!address) return address
    if (address.length <= 6) return '***'
    return address.substring(0, 6) + '***'
  }

  // 脱敏函数：车牌号
  private maskLicensePlate(plate: string): string {
    if (!plate || plate.length < 7) return plate
    return plate.substring(0, 2) + '****'
  }

  // 获取首页最新信息（需求/车辆/完单）
  async getLatestInfo() {
    const client = getSupabaseClient()

    // 查询最新需求（待接单）
    const { data: latestDemands, error: demandsError } = await client
      .from('demands')
      .select(`
        id,
        cargo_name,
        cargo_type,
        pickup_address,
        delivery_address,
        merchant_id,
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    // 查询可用车辆（激活状态）
    const { data: availableVehicles, error: vehiclesError } = await client
      .from('vehicles')
      .select(`
        id,
        vehicle_type,
        license_plate,
        owner_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)

    // 查询完单信息
    const { data: completedOrders, error: ordersError } = await client
      .from('orders')
      .select(`
        id,
        fare_price,
        actual_complete_time,
        owner_id,
        demands!inner (
          cargo_name
        )
      `)
      .eq('status', 'completed')
      .order('actual_complete_time', { ascending: false, nullsFirst: false })
      .limit(5)

    // 获取用户信息（用于脱敏）
    const merchantIds = latestDemands?.map(d => d.merchant_id).filter(Boolean) || []
    const vehicleOwnerIds = availableVehicles?.map(v => v.owner_id).filter(Boolean) || []
    const orderOwnerIds = completedOrders?.map(o => o.owner_id).filter(Boolean) || []

    const allUserIds = [...new Set([...merchantIds, ...vehicleOwnerIds, ...orderOwnerIds])]

    const { data: users, error: usersError } = allUserIds.length > 0
      ? await client
          .from('users')
          .select('id, phone')
          .in('id', allUserIds)
      : { data: [], error: null }

    // 创建用户映射
    const userMap = new Map<string, string>()
    if (users) {
      users.forEach((u: any) => {
        userMap.set(u.id, u.phone)
      })
    }

    // 脱敏处理最新需求
    const maskedDemands = latestDemands?.map((demand: any) => {
      const merchantPhone: string | undefined = userMap.get(demand.merchant_id) as string | undefined
      return {
        id: demand.id,
        cargoName: demand.cargo_name,
        cargoType: demand.cargo_type,
        pickupAddress: this.maskAddress(demand.pickup_address),
        deliveryAddress: this.maskAddress(demand.delivery_address),
        merchantPhone: this.maskPhone(merchantPhone || ''),
        createdAt: demand.created_at
      }
    }) || []

    // 脱敏处理可用车辆
    const maskedVehicles = availableVehicles?.map((vehicle: any) => {
      const ownerPhone: string | undefined = userMap.get(vehicle.owner_id) as string | undefined
      return {
        id: vehicle.id,
        vehicleType: vehicle.vehicle_type,
        licensePlate: this.maskLicensePlate(vehicle.license_plate),
        ownerPhone: this.maskPhone(ownerPhone || ''),
        status: 'active',
        createdAt: vehicle.created_at
      }
    }) || []

    // 脱敏处理完单信息
    const maskedOrders = completedOrders?.map((order: any) => {
      const ownerPhone: string | undefined = userMap.get(order.owner_id) as string | undefined
      return {
        id: order.id,
        cargoName: (order.demands as any)?.cargo_name || '',
        ownerPhone: this.maskPhone(ownerPhone || ''),
        farePrice: order.fare_price,
        completedTime: order.actual_complete_time
      }
    }) || []

    return {
      code: 200,
      message: '查询成功',
      data: {
        latestDemands: maskedDemands,
        availableVehicles: maskedVehicles,
        completedOrders: maskedOrders
      }
    }
  }

  // 获取首页统计数据
  async getStatistics() {
    const client = getSupabaseClient()

    // 查询订单总数（按状态分类）
    const { data: ordersByStatus, error: ordersError } = await client
      .from('orders')
      .select('status')

    // 查询车辆总数
    const { data: vehiclesData, error: vehiclesError } = await client
      .from('vehicles')
      .select('status')

    // 查询需求总数
    const { data: demandsData, error: demandsError } = await client
      .from('demands')
      .select('status')

    // 查询最近完成的订单（展示用）
    const { data: recentCompletedOrders, error: recentError } = await client
      .from('orders')
      .select(`
        id,
        fare_price,
        commission_amount,
        actual_complete_time,
        demands (
          cargo_name,
          pickup_address,
          delivery_address
        ),
        users!orders_owner_id_users_id_fk (
          name
        )
      `)
      .eq('status', 'completed')
      .not('actual_complete_time', 'is', null)
      .order('actual_complete_time', { ascending: false })
      .limit(5)

    if (ordersError || vehiclesError || demandsError || recentError) {
      console.error('[HomeService] 查询统计数据失败:', {
        ordersError,
        vehiclesError,
        demandsError,
        recentError
      })
      // 不抛出异常，返回默认数据
    }

    // 统计数据
    const stats = {
      orders: {
        total: ordersByStatus?.length || 0,
        completed: ordersByStatus?.filter(o => o.status === 'completed').length || 0,
        in_transit: ordersByStatus?.filter(o => o.status === 'in_transit').length || 0
      },
      vehicles: {
        total: vehiclesData?.length || 0,
        active: vehiclesData?.filter(v => v.status === 'active').length || 0
      },
      demands: {
        total: demandsData?.length || 0,
        pending: demandsData?.filter(d => d.status === 'pending').length || 0
      },
      recentOrders: recentCompletedOrders?.map((order: any) => ({
        id: order.id,
        cargoName: (order.demands as any)?.[0]?.cargo_name || '',
        ownerName: (order.users as any)?.[0]?.name || '',
        farePrice: order.fare_price,
        completeTime: order.actual_complete_time
      })) || []
    }

    return {
      code: 200,
      message: '查询成功',
      data: stats
    }
  }

  // AI分析货品照片
  async analyzeCargoPhotos(photos: string[]) {
    try {
      if (!photos || photos.length === 0) {
        throw new BadRequestException('请上传至少一张货品照片')
      }

      const { LLMClient, Config } = await import('coze-coding-dev-sdk')

      const config = new Config()
      const client = new LLMClient(config)

      // 构建消息内容
      const messageContent: any[] = [
        {
          type: 'text',
          text: `请分析这些货品照片，识别以下信息并以JSON格式返回：
{
  "cargo_name": "货品名称",
  "cargo_type": "货品类型（食品/建材/设备/日用品/其他）",
  "weight": "预估重量（公斤）",
  "volume": "预估体积（立方米）"
}

要求：
1. 货品名称要准确描述货品
2. 货品类型从以下选择：食品、建材、设备、日用品、其他
3. 重量和体积要合理估计
4. 只返回JSON，不要其他说明文字`
        }
      ]

      // 添加图片
      photos.forEach(photo => {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: photo,
            detail: 'low'  // 降低图片质量，减少token消耗
          }
        })
      })

      const messages = [{
        role: 'user' as const,
        content: messageContent
      }]

      // 使用视觉模型分析
      const response = await client.invoke(messages, {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.3
      })

      console.log('[HomeService] AI分析响应:', response.content)

      // 解析JSON响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new BadRequestException('AI分析失败，无法解析响应，请尝试减少照片数量或重新拍照')
      }

      const analysisResult = JSON.parse(jsonMatch[0])

      return {
        code: 200,
        message: '分析成功',
        data: {
          cargo_name: analysisResult.cargo_name || '',
          cargo_type: analysisResult.cargo_type || '',
          weight: analysisResult.weight || '',
          volume: analysisResult.volume || ''
        }
      }
    } catch (error) {
      console.error('[HomeService] AI分析失败:', error)
      throw new BadRequestException(error.message || 'AI分析失败')
    }
  }
}
