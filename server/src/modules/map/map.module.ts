import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { MapController } from './map.controller'
import { MapService } from './map.service'

@Module({
  imports: [HttpModule],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService]
})
export class MapModule {}
