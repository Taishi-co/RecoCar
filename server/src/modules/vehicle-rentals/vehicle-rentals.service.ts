import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateRentalDto, ConfirmRentalDto, ConfirmReturnDto } from './dto/vehicle-rentals.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class VehicleRentalsService {
  async create(createRentalDto: CreateRentalDto, renterId?: string) {
    console.log('[VehicleRentalsService] 创建租赁关系 - renterId:', renterId, 'dto:', createRentalDto)

    const {
      vehicle_id,
      owner_id,
      rent_type,
      rent_start_date,
      rent_end_date,
      contract_signed = false,
      rent_paid = false,
      deposit_paid = false,
      deposit_amount = 0,
      notes
    } = createRentalDto

    const client = getSupabaseClient()

    // 检查车辆是否存在
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      throw new BadRequestException('车辆不存在')
    }

    // 检查车辆是否可租赁
    if (!vehicle.is_available_for_rent) {
      throw new BadRequestException('该车辆不可租赁')
    }

    // 检查车辆是否已被租赁
    if (vehicle.current_renter_id) {
      throw new BadRequestException('该车辆已被租赁')
    }

    // 验证开始日期和结束日期
    const startDate = new Date(rent_start_date)
    const endDate = new Date(rent_end_date)
    if (endDate <= startDate) {
      throw new BadRequestException('结束日期必须晚于开始日期')
    }

    // 验证车主ID
    if (vehicle.owner_id !== owner_id) {
      throw new BadRequestException('车主ID不匹配')
    }

    // 验证租户ID
    if (!renterId) {
      throw new BadRequestException('租户ID不能为空')
    }

    console.log('[VehicleRentalsService] 准备插入租赁关系 - renter_id:', renterId)

    // 创建租赁关系
    const { data: rental, error: insertError } = await client
      .from('vehicle_rentals')
      .insert({
        vehicle_id,
        owner_id,
        renter_id: renterId,
        rent_type,
        rent_start_date: startDate.toISOString(),
        rent_end_date: endDate.toISOString(),
        contract_signed,
        rent_paid,
        deposit_paid,
        deposit_amount,
        status: 'pending',
        confirmed_by_owner: false,
        confirmed_by_renter: true,
        confirmed_at: new Date().toISOString(),
        notes
      })
      .select()
      .single()

    if (insertError) {
      console.error('[VehicleRentalsService] 插入失败:', insertError)
      throw new BadRequestException(`创建租赁关系失败: ${insertError.message}`)
    }

    console.log('[VehicleRentalsService] 插入成功 - rental:', rental)

    return {
      code: 200,
      message: '租赁关系已创建，请等待车主确认',
      data: rental
    }
  }

  async findByUserId(userId: string) {
    const client = getSupabaseClient()

    // 查询用户作为租户的租赁记录
    const { data: renterRentals, error: renterError } = await client
      .from('vehicle_rentals')
      .select(`
        *,
        vehicles (*)
      `)
      .eq('renter_id', userId)
      .order('created_at', { ascending: false })

    // 查询用户作为车主的租赁记录
    const { data: ownerRentals, error: ownerError } = await client
      .from('vehicle_rentals')
      .select(`
        *,
        vehicles (*),
        renters:users!vehicle_rentals_renter_id_fkey (id, name, phone)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (renterError || ownerError) {
      throw new BadRequestException(`查询失败: ${renterError?.message || ownerError?.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: {
        as_renter: renterRentals || [],
        as_owner: ownerRentals || []
      }
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: rental, error } = await client
      .from('vehicle_rentals')
      .select(`
        *,
        vehicles (*),
        owners:users!vehicle_rentals_owner_id_fkey (id, name, phone),
        renters:users!vehicle_rentals_renter_id_fkey (id, name, phone)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !rental) {
      throw new NotFoundException('租赁关系不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: rental
    }
  }

  async confirmByOwner(id: string, confirmRentalDto: ConfirmRentalDto, ownerId: string) {
    const { confirm, notes } = confirmRentalDto
    const client = getSupabaseClient()

    // 检查租赁关系是否存在
    const { data: rental, error: checkError } = await client
      .from('vehicle_rentals')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !rental) {
      throw new NotFoundException('租赁关系不存在')
    }

    // 验证车主ID
    if (rental.owner_id !== ownerId) {
      throw new BadRequestException('无权确认此租赁关系')
    }

    // 检查租赁状态
    if (rental.status !== 'pending') {
      throw new BadRequestException('只有待确认的租赁关系可以确认')
    }

    if (!confirm) {
      // 拒绝租赁
      const { data: updatedRental, error: updateError } = await client
        .from('vehicle_rentals')
        .update({
          status: 'terminated',
          confirmed_by_owner: true,
          notes: notes || '车主拒绝租赁'
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new BadRequestException(`更新失败: ${updateError.message}`)
      }

      return {
        code: 200,
        message: '已拒绝该租赁关系',
        data: updatedRental
      }
    }

    // 确认租赁
    const { data: updatedRental, error: updateError } = await client
      .from('vehicle_rentals')
      .update({
        status: 'active',
        confirmed_by_owner: true,
        confirmed_at: new Date().toISOString(),
        notes: notes || ''
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    // 更新车辆状态
    const { error: vehicleError } = await client
      .from('vehicles')
      .update({
        current_renter_id: rental.renter_id,
        rent_start_date: rental.rent_start_date,
        rent_end_date: rental.rent_end_date,
        rent_type: rental.rent_type
      })
      .eq('id', rental.vehicle_id)

    if (vehicleError) {
      throw new BadRequestException(`更新车辆状态失败: ${vehicleError.message}`)
    }

    return {
      code: 200,
      message: '租赁关系已确认',
      data: updatedRental
    }
  }

  async confirmReturn(id: string, confirmReturnDto: ConfirmReturnDto, ownerId: string) {
    const { notes } = confirmReturnDto
    const client = getSupabaseClient()

    // 检查租赁关系是否存在
    const { data: rental, error: checkError } = await client
      .from('vehicle_rentals')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !rental) {
      throw new NotFoundException('租赁关系不存在')
    }

    // 验证车主ID
    if (rental.owner_id !== ownerId) {
      throw new BadRequestException('无权确认此租赁关系')
    }

    // 检查租赁状态
    if (rental.status !== 'active') {
      throw new BadRequestException('只有激活的租赁关系可以确认归还')
    }

    // 更新租赁关系状态
    const { data: updatedRental, error: updateError } = await client
      .from('vehicle_rentals')
      .update({
        status: 'expired',
        notes: notes || '车辆已归还'
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(`更新失败: ${updateError.message}`)
    }

    // 清除车辆租赁状态
    const { error: vehicleError } = await client
      .from('vehicles')
      .update({
        current_renter_id: null,
        rent_start_date: null,
        rent_end_date: null,
        rent_type: null
      })
      .eq('id', rental.vehicle_id)

    if (vehicleError) {
      throw new BadRequestException(`更新车辆状态失败: ${vehicleError.message}`)
    }

    return {
      code: 200,
      message: '车辆已确认归还',
      data: updatedRental
    }
  }

  async getAvailableVehicles() {
    const client = getSupabaseClient()

    // 查询可租赁车辆
    const { data: vehicles, error } = await client
      .from('vehicles')
      .select('*')
      .eq('is_available_for_rent', true)
      .is('current_renter_id', null)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    // 为每个车辆查询车主信息
    const vehiclesWithOwner = await Promise.all(
      (vehicles || []).map(async (vehicle) => {
        const { data: owner, error: ownerError } = await client
          .from('users')
          .select('id, name, phone, avatar_url')
          .eq('id', vehicle.owner_id)
          .maybeSingle()

        return {
          ...vehicle,
          owners: ownerError ? null : owner
        }
      })
    )

    return {
      code: 200,
      message: '查询成功',
      data: vehiclesWithOwner
    }
  }

  async getVehicleRentalInfo(vehicleId: string) {
    const client = getSupabaseClient()

    // 获取车辆信息
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle()

    if (vehicleError || !vehicle) {
      throw new NotFoundException('车辆不存在')
    }

    // 查询车主信息
    const { data: owner, error: ownerError } = await client
      .from('users')
      .select('id, name, phone, avatar_url')
      .eq('id', vehicle.owner_id)
      .maybeSingle()

    return {
      code: 200,
      message: '查询成功',
      data: {
        id: vehicle.id,
        vehicle_type: vehicle.vehicle_type,
        license_plate: vehicle.license_plate,
        load_capacity: vehicle.load_capacity,
        volume: vehicle.volume,
        battery_life: vehicle.battery_life,
        has_cold_chain: vehicle.has_cold_chain,
        photos: vehicle.photos,
        owner: ownerError ? null : owner,
        is_available_for_rent: vehicle.is_available_for_rent,
        rent_monthly_price: vehicle.rent_monthly_price,
        rent_yearly_price: vehicle.rent_yearly_price,
        rent_deposit: vehicle.rent_deposit,
        contact_phone: vehicle.contact_phone,
        contact_wechat: vehicle.contact_wechat,
        current_renter_id: vehicle.current_renter_id,
        rent_start_date: vehicle.rent_start_date,
        rent_end_date: vehicle.rent_end_date,
        rent_type: vehicle.rent_type
      }
    }
  }

  async getPendingRentalsForOwner(ownerId: string) {
    console.log('[VehicleRentalsService] 获取车主待确认租赁申请 - ownerId:', ownerId)

    const client = getSupabaseClient()

    // 查询车主待确认的租赁申请
    const { data: pendingRentals, error } = await client
      .from('vehicle_rentals')
      .select(`
        *,
        vehicles (*),
        renters:users!vehicle_rentals_renter_id_fkey (id, name, phone, avatar_url)
      `)
      .eq('owner_id', ownerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      throw new BadRequestException(`查询失败: ${error.message}`)
    }

    return {
      code: 200,
      message: '查询成功',
      data: pendingRentals || []
    }
  }
}
