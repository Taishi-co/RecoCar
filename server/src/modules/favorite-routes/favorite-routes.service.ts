import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateRouteDto, UpdateRouteDto } from './dto/favorite-routes.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class FavoriteRoutesService {
  async create(createRouteDto: CreateRouteDto) {
    const {
      user_id,
      route_name,
      pickup_address_id,
      delivery_address_id,
      pickup_address_name,
      pickup_address,
      pickup_lat,
      pickup_lng,
      delivery_address_name,
      delivery_address,
      delivery_lat,
      delivery_lng,
      estimated_distance,
      estimated_fare,
    } = createRouteDto

    const client = getSupabaseClient()

    // 如果提供了地址ID，验证地址是否存在
    if (pickup_address_id) {
      const { data, error } = await client
        .from('address_books')
        .select('*')
        .eq('id', pickup_address_id)
        .single()

      if (error || !data) {
        throw new NotFoundException('取货地址不存在')
      }
    }

    if (delivery_address_id) {
      const { data, error } = await client
        .from('address_books')
        .select('*')
        .eq('id', delivery_address_id)
        .single()

      if (error || !data) {
        throw new NotFoundException('收货地址不存在')
      }
    }

    // 插入线路记录
    const { data: route, error: insertError } = await client
      .from('favorite_routes')
      .insert({
        user_id,
        route_name,
        pickup_address_id: pickup_address_id || null,
        delivery_address_id: delivery_address_id || null,
        estimated_distance,
        estimated_fare,
        use_count: 0,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[FavoriteRoutesService] 创建线路失败:', insertError)
      throw new BadRequestException('创建线路失败')
    }

    // 查询关联的地址信息
    let pickupAddress: any = null
    let deliveryAddress: any = null

    if (pickup_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', pickup_address_id)
        .single()
      pickupAddress = data
    }

    if (delivery_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', delivery_address_id)
        .single()
      deliveryAddress = data
    }

    return {
      code: 200,
      message: '线路创建成功',
      data: {
        ...route,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress
      }
    }
  }

  async findByUserId(userId: string) {
    const client = getSupabaseClient()

    const { data: routes, error } = await client
      .from('favorite_routes')
      .select('*')
      .eq('user_id', userId)
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[FavoriteRoutesService] 查询线路列表失败:', error)
      throw new BadRequestException('查询线路列表失败')
    }

    // 查询每个线路的关联地址
    const enrichedRoutes = await Promise.all((routes || []).map(async (route) => {
      let pickupAddress: any = null
      let deliveryAddress: any = null

      if (route.pickup_address_id) {
        const { data } = await client
          .from('address_books')
          .select('id, address_name, address, latitude, longitude')
          .eq('id', route.pickup_address_id)
          .single()
        pickupAddress = data
      }

      if (route.delivery_address_id) {
        const { data } = await client
          .from('address_books')
          .select('id, address_name, address, latitude, longitude')
          .eq('id', route.delivery_address_id)
          .single()
        deliveryAddress = data
      }

      return {
        ...route,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress
      }
    }))

    return {
      code: 200,
      message: '查询成功',
      data: enrichedRoutes || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: route, error } = await client
      .from('favorite_routes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !route) {
      throw new NotFoundException('线路不存在')
    }

    // 查询关联的地址信息
    let pickupAddress: any = null
    let deliveryAddress: any = null

    if (route.pickup_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.pickup_address_id)
        .single()
      pickupAddress = data
    }

    if (route.delivery_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.delivery_address_id)
        .single()
      deliveryAddress = data
    }

    return {
      code: 200,
      message: '查询成功',
      data: {
        ...route,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress
      }
    }
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const client = getSupabaseClient()

    // 先查询线路是否存在
    const { data: existingRoute, error: queryError } = await client
      .from('favorite_routes')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingRoute) {
      throw new NotFoundException('线路不存在')
    }

    const { data: route, error: updateError } = await client
      .from('favorite_routes')
      .update({
        ...updateRouteDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('[FavoriteRoutesService] 更新线路失败:', updateError)
      throw new BadRequestException('更新线路失败')
    }

    // 查询关联的地址信息
    let pickupAddress: any = null
    let deliveryAddress: any = null

    if (route.pickup_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.pickup_address_id)
        .single()
      pickupAddress = data
    }

    if (route.delivery_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.delivery_address_id)
        .single()
      deliveryAddress = data
    }

    return {
      code: 200,
      message: '线路更新成功',
      data: {
        ...route,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress
      }
    }
  }

  async delete(id: string) {
    const client = getSupabaseClient()

    // 先查询线路是否存在
    const { data: existingRoute, error: queryError } = await client
      .from('favorite_routes')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingRoute) {
      throw new NotFoundException('线路不存在')
    }

    const { error: deleteError } = await client
      .from('favorite_routes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[FavoriteRoutesService] 删除线路失败:', deleteError)
      throw new BadRequestException('删除线路失败')
    }

    return {
      code: 200,
      message: '线路删除成功',
      data: null
    }
  }

  async incrementUseCount(id: string) {
    const client = getSupabaseClient()

    // 先查询线路是否存在
    const { data: existingRoute, error: queryError } = await client
      .from('favorite_routes')
      .select('use_count')
      .eq('id', id)
      .single()

    if (queryError || !existingRoute) {
      throw new NotFoundException('线路不存在')
    }

    // 增加使用次数
    const { data: route, error: updateError } = await client
      .from('favorite_routes')
      .update({
        use_count: (existingRoute.use_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('[FavoriteRoutesService] 更新使用次数失败:', updateError)
      throw new BadRequestException('更新使用次数失败')
    }

    // 查询关联的地址信息
    let pickupAddress: any = null
    let deliveryAddress: any = null

    if (route.pickup_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.pickup_address_id)
        .single()
      pickupAddress = data
    }

    if (route.delivery_address_id) {
      const { data } = await client
        .from('address_books')
        .select('id, address_name, address, latitude, longitude')
        .eq('id', route.delivery_address_id)
        .single()
      deliveryAddress = data
    }

    return {
      code: 200,
      message: '更新成功',
      data: {
        ...route,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress
      }
    }
  }
}
