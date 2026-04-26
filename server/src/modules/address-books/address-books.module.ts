import { Module } from '@nestjs/common'
import { AddressBooksService } from './address-books.service'
import { AddressBooksController } from './address-books.controller'

@Module({
  controllers: [AddressBooksController],
  providers: [AddressBooksService],
  exports: [AddressBooksService],
})
export class AddressBooksModule {}
