import { Module } from '@nestjs/common'
import { DemandsService } from './demands.service'
import { DemandsController } from './demands.controller'

@Module({
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService]
})
export class DemandsModule {}
