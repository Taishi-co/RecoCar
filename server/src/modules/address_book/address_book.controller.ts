import { Controller, Post, Get, Put, Delete, Body, Query, Param, Req } from '@nestjs/common'
import { AddressBookService } from './address_book.service'
import { CreateAddressBookDto, UpdateAddressBookDto } from './dto/address_book.dto'

@Controller('address-books')
export class AddressBookController {
  constructor(private readonly addressBookService: AddressBookService) {}

  @Post()
  async createAddressBook(@Body() createAddressBookDto: CreateAddressBookDto) {
    console.log('[AddressBookController] 创建地址请求:', createAddressBookDto)
    return this.addressBookService.create(createAddressBookDto)
  }

  @Get()
  async getAddressBooks(
    @Query('user_id') userId?: string,
    @Query('address_type') addressType?: 'pickup' | 'delivery'
  ) {
    console.log('[AddressBookController] 查询地址列表 - userId:', userId, 'addressType:', addressType)
    if (!userId) {
      return {
        code: 400,
        message: '缺少用户ID参数',
        data: null
      }
    }
    return this.addressBookService.findByUserId(userId, addressType)
  }

  @Get(':id')
  async getAddressBookById(@Param('id') id: string) {
    return this.addressBookService.findById(id)
  }

  @Put(':id')
  async updateAddressBook(
    @Param('id') id: string,
    @Body() updateAddressBookDto: UpdateAddressBookDto
  ) {
    console.log('[AddressBookController] 更新地址请求 - id:', id, 'data:', updateAddressBookDto)
    return this.addressBookService.update(id, updateAddressBookDto)
  }

  @Delete(':id')
  async deleteAddressBook(@Param('id') id: string) {
    console.log('[AddressBookController] 删除地址请求 - id:', id)
    return this.addressBookService.delete(id)
  }

  @Post(':id/set-default')
  async setDefaultAddress(@Param('id') id: string) {
    console.log('[AddressBookController] 设置默认地址请求 - id:', id)
    return this.addressBookService.setDefault(id)
  }
}
