import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { S3Storage } from 'coze-coding-dev-sdk'

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

@Injectable()
export class VehiclesService {
  async create(createVehicleDto: CreateVehicleDto, photos?: any) {
    const {
      owner_id,
      vehicle_type,
      license_plate,
      load_capacity,
      volume,
      battery_life,
      has_cold_chain,
      operation_area,
      available_hours,
      photoUrls,
      base_price = 20,
      base_distance = 3,
      price_per_km = 2
    } = createVehicleDto

    console.log('[VehiclesService] 创建车辆，photoUrls:', photoUrls)

    // 验证用户是否存在
    const client = getSupabaseClient()
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('id', owner_id)
      .maybeSingle()

    if (userError || !user) {
      throw new BadRequestException('用户不存在')
    }

    // 验证用户角色
    if (user.role !== 'owner') {
      throw new BadRequestException('只有车主可以注册车辆')
    }

    // 使用前端传递的 photoUrls
    let photoKeys: string[] = []
    if (photoUrls && Array.isArray(photoUrls)) {
      photoKeys = photoUrls
      console.log('[VehiclesService] 使用前端传递的照片 URL:', photoKeys)
    }

    // 创建车辆记录（包含定价信息）
    const { data: vehicle, error: insertError } = await client
      .from('vehicles')
      .insert({
        owner_id,
        vehicle_type,
        license_plate,
        load_capacity: parseFloat(load_capacity),
        volume: parseFloat(volume),
        battery_life: parseFloat(battery_life),
        has_cold_chain: has_cold_chain === 'true',
        operation_area: operation_area ? JSON.parse(operation_area) : null,
        available_hours: available_hours ? JSON.parse(available_hours) : null,
        status: 'pending', // 默认待审核状态，需要后台审核通过才能使用
        photos: photoKeys.length > 0 ? JSON.stringify(photoKeys) : null,
        // 定价信息
        base_price: base_price,
        base_distance: base_distance,
        price_per_km: price_per_km,
        price_updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new BadRequestException(`创建车辆失败: ${insertError.message}`)
    }

    return {
      code: 200,
      message: '车辆注册成功，等待后台审核',
      data: vehicle
    }
  }

  async findByOwnerId(ownerId?: string, userId?: string) {
    const client = getSupabaseClient()

    console.log('[VehiclesService] 根据车主ID查询车辆 - ownerId:', ownerId, 'userId:', userId)

    let vehicles: any[] = []

    if (ownerId) {
      // 1. 查询用户拥有的车辆
      const { data: ownedVehicles, error: ownedError } = await client
        .from('vehicles')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (ownedError) {
        throw new BadRequestException(`查询失败: ${ownedError.message}`)
      }

      // 2. 查询用户租赁的车辆（处于 active 状态的租赁）
      const { data: activeRentals, error: rentalsError } = await client
        .from('vehicle_rentals')
        .select('vehicle_id, renter_id')
        .eq('renter_id', ownerId)
        .eq('status', 'active')

      if (rentalsError) {
        throw new BadRequestException(`查询租赁记录失败: ${rentalsError.message}`)
      }

      // 3. 获取租赁车辆的信息
      const rentedVehicleIds = (activeRentals || []).map(r => r.vehicle_id)
      let rentedVehicles: any[] = []

      if (rentedVehicleIds.length > 0) {
        const { data: rentedVehiclesData, error: rentedError } = await client
          .from('vehicles')
          .select('*')
          .in('id', rentedVehicleIds)

        if (!rentedError) {
          rentedVehicles = rentedVehiclesData || []
        }
      }

      // 4. 合并车辆列表，避免重复
      const vehicleMap = new Map();

      // 添加拥有的车辆，标记为 owned
      (ownedVehicles || []).forEach(vehicle => {
        vehicleMap.set(vehicle.id, { ...vehicle, ownership_type: 'owned' })
      })

      // 添加租赁的车辆，标记为 rented
      rentedVehicles.forEach(vehicle => {
        if (!vehicleMap.has(vehicle.id)) {
          vehicleMap.set(vehicle.id, { ...vehicle, ownership_type: 'rented' })
        }
      })

      vehicles = Array.from(vehicleMap.values())
    } else {
      // 如果没有指定 ownerId，返回所有车辆
      const { data: allVehicles, error } = await client
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new BadRequestException(`查询失败: ${error.message}`)
      }

      vehicles = allVehicles || []
    }

    // 为每个车辆查询车主信息，并计算权限
    const vehiclesWithOwner = await Promise.all(
      vehicles.map(async (vehicle) => {
        const { data: owner, error: ownerError } = await client
          .from('users')
          .select('id, phone, role, name')
          .eq('id', vehicle.owner_id)
          .maybeSingle()

        // 计算出车状态控制权限
        let canToggle = false
        let reason: string | null = null

        if (userId) {
          const isOwner = vehicle.owner_id === userId
          const isRenter = vehicle.current_renter_id === userId

          if (vehicle.current_renter_id) {
            // 车辆已被租出
            if (isOwner) {
              // 车主不能操作已出租的车辆
              canToggle = false
              reason = '车辆已租出，禁用操作'
            } else if (isRenter) {
              // 租户可以操作租赁中的车辆
              canToggle = true
              reason = null
            } else {
              // 其他用户不能操作
              canToggle = false
              reason = '您无权操作该车辆'
            }
          } else {
            // 车辆未被租出
            if (isOwner) {
              // 车主可以操作未租出的车辆
              canToggle = true
              reason = null
            } else if (isRenter) {
              // 租户不能操作到期的车辆
              canToggle = false
              reason = '租赁已到期，禁用操作'
            } else {
              // 其他用户不能操作
              canToggle = false
              reason = '您无权操作该车辆'
            }
          }
        } else {
          // 没有提供用户ID，默认可以操作（兼容旧版本）
          canToggle = true
          reason = null
        }

        return {
          ...vehicle,
          owner: ownerError ? null : owner,
          can_toggle_availability: canToggle,
          availability_control_reason: reason
        }
      })
    )

    return {
      code: 200,
      message: '查询成功',
      data: vehiclesWithOwner
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()
    const { data: vehicle, error } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !vehicle) {
      throw new NotFoundException('车辆不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: vehicle
    }
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto, photos?: any) {
    const client = getSupabaseClient()

    const {
      vehicle_type,
      license_plate,
      load_capacity,
      volume,
      battery_life,
      has_cold_chain,
      operation_area,
      available_hours,
      photoUrls,
      base_price,
      base_distance,
      price_per_km
    } = updateVehicleDto

    console.log('[VehiclesService] 更新车辆，photoUrls:', photoUrls)

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 使用前端传递的 photoUrls
    let photoKeys: string[] = []
    if (photoUrls && Array.isArray(photoUrls)) {
      photoKeys = photoUrls
      console.log('[VehiclesService] 使用前端传递的照片 URL:', photoKeys)
    } else {
      // 保留旧照片
      if (existingVehicle.photos) {
        photoKeys = JSON.parse(existingVehicle.photos)
      }
    }

    // 更新车辆信息
    const updateData: any = {
      vehicle_type: updateVehicleDto.vehicle_type || existingVehicle.vehicle_type,
      license_plate: updateVehicleDto.license_plate || existingVehicle.license_plate,
      load_capacity: updateVehicleDto.load_capacity ? parseFloat(updateVehicleDto.load_capacity) : existingVehicle.load_capacity,
      volume: updateVehicleDto.volume ? parseFloat(updateVehicleDto.volume) : existingVehicle.volume,
      battery_life: updateVehicleDto.battery_life ? parseFloat(updateVehicleDto.battery_life) : existingVehicle.battery_life,
      has_cold_chain: updateVehicleDto.has_cold_chain !== undefined
        ? updateVehicleDto.has_cold_chain === 'true'
        : existingVehicle.has_cold_chain,
      operation_area: updateVehicleDto.operation_area ? JSON.parse(updateVehicleDto.operation_area) : existingVehicle.operation_area,
      available_hours: updateVehicleDto.available_hours ? JSON.parse(updateVehicleDto.available_hours) : existingVehicle.available_hours,
    }

    // 添加定价参数（如果提供）
    if (base_price !== undefined) {
      updateData.base_price = base_price
    }
    if (base_distance !== undefined) {
      updateData.base_distance = base_distance
    }
    if (price_per_km !== undefined) {
      updateData.price_per_km = price_per_km
    }

    // 如果修改了定价，更新定价时间
    if (base_price !== undefined || base_distance !== undefined || price_per_km !== undefined) {
      updateData.price_updated_at = new Date().toISOString()
    }

    if (photoKeys.length > 0) {
      updateData.photos = JSON.stringify(photoKeys)
    }

    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '更新成功',
      data: vehicle
    }
  }

  async updateStatus(id: string, status: string) {
    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 验证状态值
    const validStatuses = ['pending', 'active', 'rejected', 'inactive']
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('无效的状态值')
    }

    // 更新状态
    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新状态失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '状态更新成功',
      data: vehicle
    }
  }

  async review(id: string, action: string, reason?: string) {
    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 验证审核动作
    if (action !== 'approve' && action !== 'reject') {
      throw new BadRequestException('无效的审核动作')
    }

    // 更新状态
    const status = action === 'approve' ? 'active' : 'rejected'
    const updateData: any = { status }

    // 如果拒绝，记录拒绝原因
    if (action === 'reject' && reason) {
      updateData.remarks = reason
    }

    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`审核失败: ${updateError.message}`)
    }

    const message = action === 'approve' ? '车辆审核通过' : '车辆已拒绝'

    return {
      code: 200,
      message,
      data: vehicle
    }
  }

  async resubmit(id: string) {
    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 检查车辆状态，只有被拒绝的车辆可以重新提交
    if (existingVehicle.status !== 'rejected') {
      throw new BadRequestException('只有被拒绝的车辆可以重新提交')
    }

    // 重新提交：将状态改为 pending，清除拒绝原因
    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update({
        status: 'pending',
        remarks: null  // 清除拒绝原因
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`重新提交失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '已重新提交审核',
      data: vehicle
    }
  }

  async updateAvailability(id: string, isAvailable: boolean, userId?: string) {
    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 验证用户ID
    if (!userId) {
      throw new BadRequestException('用户ID不能为空')
    }

    // 判断用户身份
    const isOwner = existingVehicle.owner_id === userId
    const isRenter = existingVehicle.current_renter_id === userId

    // 检查权限
    if (!isOwner && !isRenter) {
      throw new ForbiddenException('您无权操作该车辆')
    }

    // 检查车辆状态和用户身份的组合
    if (existingVehicle.current_renter_id) {
      // 车辆已被租出
      if (isOwner) {
        // 车主不能操作已出租的车辆
        throw new BadRequestException('车辆已租出，禁用操作')
      }
      // 租户可以操作（继续执行）
    } else {
      // 车辆未被租出
      if (isRenter) {
        // 租户不能操作到期的车辆
        throw new BadRequestException('租赁已到期，禁用操作')
      }
      // 车主可以操作（继续执行）
    }

    // 检查车辆审核状态，只有审核通过的车辆可以切换运营状态
    if (existingVehicle.status !== 'active') {
      throw new BadRequestException('只有审核通过的车辆可以切换运营状态')
    }

    // 检查车辆是否在运输中，已接单的车辆不能切换出车状态
    if (existingVehicle.trip_status === 'in_transit' && !isAvailable) {
      throw new BadRequestException('车辆正在运输中，无法设置为不出车状态')
    }

    // 更新运营状态
    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新运营状态失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: isAvailable ? '车辆已设置为出车' : '车辆已设置为不出车',
      data: vehicle
    }
  }

  async getRentalSettings(id: string) {
    const client = getSupabaseClient()

    const { data: vehicle, error } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !vehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 返回租赁相关字段
    return {
      code: 200,
      message: '查询成功',
      data: {
        id: vehicle.id,
        is_available_for_rent: vehicle.is_available_for_rent || false,
        rent_monthly_price: vehicle.rent_monthly_price || 0,
        rent_yearly_price: vehicle.rent_yearly_price || 0,
        rent_deposit: vehicle.rent_deposit || 0,
        contact_phone: vehicle.contact_phone,
        contact_wechat: vehicle.contact_wechat,
        current_renter_id: vehicle.current_renter_id,
        rent_start_date: vehicle.rent_start_date,
        rent_end_date: vehicle.rent_end_date,
        rent_type: vehicle.rent_type,
        rental_notes: vehicle.rental_notes
      }
    }
  }

  async updateRentalSettings(id: string, settings: {
    is_available_for_rent?: boolean
    rent_monthly_price?: number
    rent_yearly_price?: number
    rent_deposit?: number
    contact_phone?: string
    contact_wechat?: string
    notes?: string
  }) {
    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: existingVehicle, error: checkError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !existingVehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 检查车辆审核状态，只有审核通过的车辆可以设置租赁
    if (existingVehicle.status !== 'active') {
      throw new BadRequestException('只有审核通过的车辆可以设置租赁')
    }

    // 检查是否是租赁车辆，租赁车辆不能设置为可租赁状态（防止转租）
    if (settings.is_available_for_rent === true && existingVehicle.current_renter_id) {
      throw new BadRequestException('租赁车辆不能设置为可租赁状态，请先归还车辆')
    }

    // 构建更新数据
    const updateData: any = {}

    if (settings.is_available_for_rent !== undefined) {
      updateData.is_available_for_rent = settings.is_available_for_rent
    }
    if (settings.rent_monthly_price !== undefined) {
      updateData.rent_monthly_price = settings.rent_monthly_price
    }
    if (settings.rent_yearly_price !== undefined) {
      updateData.rent_yearly_price = settings.rent_yearly_price
    }
    if (settings.rent_deposit !== undefined) {
      updateData.rent_deposit = settings.rent_deposit
    }
    if (settings.contact_phone !== undefined) {
      updateData.contact_phone = settings.contact_phone
    }
    if (settings.contact_wechat !== undefined) {
      updateData.contact_wechat = settings.contact_wechat
    }
    if (settings.notes !== undefined) {
      updateData.rental_notes = settings.notes
    }

    // 更新车辆租赁设置
    const { data: vehicle, error: updateError } = await client
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新租赁设置失败: ${updateError.message}`)
    }

    return {
      code: 200,
      message: '租赁设置已更新',
      data: {
        id: vehicle.id,
        is_available_for_rent: vehicle.is_available_for_rent,
        rent_monthly_price: vehicle.rent_monthly_price,
        rent_yearly_price: vehicle.rent_yearly_price,
        rent_deposit: vehicle.rent_deposit,
        contact_phone: vehicle.contact_phone,
        contact_wechat: vehicle.contact_wechat,
        rental_notes: vehicle.rental_notes
      }
    }
  }
}
