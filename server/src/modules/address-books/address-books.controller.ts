import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { AddressBooksService } from './address-books.service'
import { CreateAddressDto, UpdateAddressDto } from './dto/address-books.dto'

@Controller('address-books')
export class AddressBooksController {
  constructor(private readonly addressBooksService: AddressBooksService) {}

  @Post()
  async createAddress(@Body() createAddressDto: CreateAddressDto) {
    console.log('[AddressBooksController] 创建地址请求:', createAddressDto)
    return this.addressBooksService.create(createAddressDto)
  }

  @Get()
  async getAddressBooks(@Query('user_id') userId: string) {
    console.log('[AddressBooksController] 查询地址列表 - userId:', userId)
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      }
    }
    return this.addressBooksService.findByUserId(userId)
  }

  @Get(':id')
  async getAddressById(@Param('id') id: string) {
    return this.addressBooksService.findById(id)
  }

  @Put(':id')
  async updateAddress(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    console.log('[AddressBooksController] 更新地址请求 - id:', id, updateAddressDto)
    return this.addressBooksService.update(id, updateAddressDto)
  }

  @Delete(':id')
  async deleteAddress(@Param('id') id: string) {
    console.log('[AddressBooksController] 删除地址请求 - id:', id)
    return this.addressBooksService.delete(id)
  }

  @Post(':id/set-default')
  async setDefaultAddress(@Param('id') id: string) {
    console.log('[AddressBooksController] 设置默认地址请求 - id:', id)
    return this.addressBooksService.setDefault(id)
  }
}
