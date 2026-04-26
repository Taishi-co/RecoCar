import { Module } from '@nestjs/common'
import { FavoriteRoutesService } from './favorite-routes.service'
import { FavoriteRoutesController } from './favorite-routes.controller'

@Module({
  controllers: [FavoriteRoutesController],
  providers: [FavoriteRoutesService],
  exports: [FavoriteRoutesService],
})
export class FavoriteRoutesModule {}
