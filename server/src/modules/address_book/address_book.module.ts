import { Module } from '@nestjs/common'
import { AddressBookController } from './address_book.controller'
import { AddressBookService } from './address_book.service'

@Module({
  controllers: [AddressBookController],
  providers: [AddressBookService],
  exports: [AddressBookService]
})
export class AddressBookModule {}
