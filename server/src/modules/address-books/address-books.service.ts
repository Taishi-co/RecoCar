import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateAddressDto, UpdateAddressDto } from './dto/address-books.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class AddressBooksService {
  async create(createAddressDto: CreateAddressDto) {
    const { user_id, address_name, address, latitude, longitude, address_type, is_default } = createAddressDto

    const client = getSupabaseClient()

    // 如果设置为默认地址，先将该用户的其他地址取消默认
    if (is_default) {
      await client
        .from('address_books')
        .update({ is_default: false })
        .eq('user_id', user_id)
    }

    const { data: addressBook, error: insertError } = await client
      .from('address_books')
      .insert({
        user_id,
        address_name,
        address,
        latitude,
        longitude,
        address_type: address_type || 'other',
        is_default: is_default || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[AddressBooksService] 创建地址失败:', insertError)
      throw new BadRequestException('创建地址失败')
    }

    return {
      code: 200,
      message: '地址创建成功',
      data: addressBook
    }
  }

  async findByUserId(userId: string) {
    const client = getSupabaseClient()

    const { data: addresses, error } = await client
      .from('address_books')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AddressBooksService] 查询地址列表失败:', error)
      throw new BadRequestException('查询地址列表失败')
    }

    return {
      code: 200,
      message: '查询成功',
      data: addresses || []
    }
  }

  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: address, error } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !address) {
      throw new NotFoundException('地址不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: address
    }
  }

  async update(id: string, updateAddressDto: UpdateAddressDto) {
    const client = getSupabaseClient()

    // 先查询地址是否存在
    const { data: existingAddress, error: queryError } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingAddress) {
      throw new NotFoundException('地址不存在')
    }

    // 如果设置为默认地址，先将该用户的其他地址取消默认
    if (updateAddressDto.is_default) {
      await client
        .from('address_books')
        .update({ is_default: false })
        .eq('user_id', existingAddress.user_id)
        .neq('id', id)
    }

    const { data: address, error: updateError } = await client
      .from('address_books')
      .update({
        ...updateAddressDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[AddressBooksService] 更新地址失败:', updateError)
      throw new BadRequestException('更新地址失败')
    }

    return {
      code: 200,
      message: '地址更新成功',
      data: address
    }
  }

  async delete(id: string) {
    const client = getSupabaseClient()

    // 先查询地址是否存在
    const { data: existingAddress, error: queryError } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingAddress) {
      throw new NotFoundException('地址不存在')
    }

    const { error: deleteError } = await client
      .from('address_books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[AddressBooksService] 删除地址失败:', deleteError)
      throw new BadRequestException('删除地址失败')
    }

    return {
      code: 200,
      message: '地址删除成功',
      data: null
    }
  }

  async setDefault(id: string) {
    const client = getSupabaseClient()

    // 先查询地址是否存在
    const { data: existingAddress, error: queryError } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (queryError || !existingAddress) {
      throw new NotFoundException('地址不存在')
    }

    // 先将该用户的其他地址取消默认
    await client
      .from('address_books')
      .update({ is_default: false })
      .eq('user_id', existingAddress.user_id)

    // 设置当前地址为默认
    const { data: address, error: updateError } = await client
      .from('address_books')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[AddressBooksService] 设置默认地址失败:', updateError)
      throw new BadRequestException('设置默认地址失败')
    }

    return {
      code: 200,
      message: '设置默认地址成功',
      data: address
    }
  }
}
