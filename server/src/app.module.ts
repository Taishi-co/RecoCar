import { Module } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { AuthModule } from '@/modules/auth/auth.module'
import { DemandsModule } from '@/modules/demands/demands.module'
import { OrdersModule } from '@/modules/orders/orders.module'
import { VehiclesModule } from '@/modules/vehicles/vehicles.module'
import { AdminModule } from '@/modules/admin/admin.module'
import { PlatformModule } from '@/modules/platform/platform.module'
import { HomeModule } from '@/modules/home/home.module'
import { MapModule } from '@/modules/map/map.module'

@Module({
  imports: [
    AuthModule,
    DemandsModule,
    OrdersModule,
    VehiclesModule,
    AdminModule,
    PlatformModule,
    HomeModule,
    MapModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
