import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateAddressBookDto, UpdateAddressBookDto } from './dto/address_book.dto'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class AddressBookService {
  // 创建地址
  async create(createAddressBookDto: CreateAddressBookDto) {
    const {
      user_id,
      address_type,
      title,
      address,
      latitude,
      longitude,
      tag,
      is_default = false
    } = createAddressBookDto

    const client = getSupabaseClient()

    try {
      // 如果设置为默认地址，先取消该用户该类型的其他默认地址
      if (is_default) {
        await client
          .from('address_books')
          .update({ is_default: false })
          .eq('user_id', user_id)
          .eq('address_type', address_type)
      }

      // 创建地址
      const { data: addressBook, error } = await client
        .from('address_books')
        .insert({
          user_id,
          address_type,
          title,
          address,
          latitude,
          longitude,
          tag,
          is_default,
        })
        .select()
        .single()

      if (error) {
        console.error('[AddressBookService] 创建地址失败:', error)
        throw new BadRequestException('创建地址失败')
      }

      return {
        code: 200,
        message: '创建成功',
        data: addressBook
      }
    } catch (error) {
      console.error('[AddressBookService] 创建地址异常:', error)
      throw error
    }
  }

  // 查询地址列表
  async findByUserId(userId: string, addressType?: 'pickup' | 'delivery') {
    const client = getSupabaseClient()

    let query = client
      .from('address_books')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressType) {
      query = query.eq('address_type', addressType)
    }

    const { data: addresses, error } = await query

    if (error) {
      console.error('[AddressBookService] 查询地址列表失败:', error)
      throw new BadRequestException('查询地址列表失败')
    }

    return {
      code: 200,
      message: '查询成功',
      data: addresses || []
    }
  }

  // 查询单个地址
  async findById(id: string) {
    const client = getSupabaseClient()

    const { data: address, error } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[AddressBookService] 查询地址失败:', error)
      throw new NotFoundException('地址不存在')
    }

    return {
      code: 200,
      message: '查询成功',
      data: address
    }
  }

  // 更新地址
  async update(id: string, updateAddressBookDto: UpdateAddressBookDto) {
    const client = getSupabaseClient()

    // 先查询地址是否存在
    const { data: existing } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      throw new NotFoundException('地址不存在')
    }

    try {
      // 如果设置为默认地址，先取消该用户该类型的其他默认地址
      if (updateAddressBookDto.is_default === true) {
        await client
          .from('address_books')
          .update({ is_default: false })
          .eq('user_id', existing.user_id)
          .eq('address_type', existing.address_type)
          .neq('id', id)
      }

      // 更新地址
      const { data: addressBook, error } = await client
        .from('address_books')
        .update({
          ...updateAddressBookDto,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[AddressBookService] 更新地址失败:', error)
        throw new BadRequestException('更新地址失败')
      }

      return {
        code: 200,
        message: '更新成功',
        data: addressBook
      }
    } catch (error) {
      console.error('[AddressBookService] 更新地址异常:', error)
      throw error
    }
  }

  // 删除地址
  async delete(id: string) {
    const client = getSupabaseClient()

    const { data: existing } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      throw new NotFoundException('地址不存在')
    }

    const { error } = await client
      .from('address_books')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[AddressBookService] 删除地址失败:', error)
      throw new BadRequestException('删除地址失败')
    }

    return {
      code: 200,
      message: '删除成功',
      data: null
    }
  }

  // 设置默认地址
  async setDefault(id: string) {
    const client = getSupabaseClient()

    // 先查询地址
    const { data: existing } = await client
      .from('address_books')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      throw new NotFoundException('地址不存在')
    }

    try {
      // 取消该用户该类型的其他默认地址
      await client
        .from('address_books')
        .update({ is_default: false })
        .eq('user_id', existing.user_id)
        .eq('address_type', existing.address_type)
        .neq('id', id)

      // 设置为默认地址
      const { data: addressBook, error } = await client
        .from('address_books')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[AddressBookService] 设置默认地址失败:', error)
        throw new BadRequestException('设置默认地址失败')
      }

      return {
        code: 200,
        message: '设置成功',
        data: addressBook
      }
    } catch (error) {
      console.error('[AddressBookService] 设置默认地址异常:', error)
      throw error
    }
  }
}
