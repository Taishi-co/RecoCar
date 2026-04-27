import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { VehiclesModule } from '@/modules/vehicles/vehicles.module';
import { DemandsModule } from '@/modules/demands/demands.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { PlatformModule } from '@/modules/platform/platform.module';
import { HomeModule } from '@/modules/home/home.module';
import { NotificationsModule } from '@/modules/notifications/notification.module';
import { CancellationsModule } from '@/modules/cancellations/cancellations.module';
import { AddressBooksModule } from '@/modules/address-books/address-books.module';
import { FavoriteRoutesModule } from '@/modules/favorite-routes/favorite-routes.module';
import { AccountSettingsModule } from '@/modules/account-settings/account-settings.module';
import { FareCalculationModule } from '@/modules/fare-calculation/fare-calculation.module';
import { DemandTemplatesModule } from '@/modules/demand-templates/demand-templates.module';
import { DemandSchedulesModule } from '@/modules/demand-schedules/demand-schedules.module';
import { ScheduleServiceModule } from '@/modules/schedule-service/schedule-service.module';
import { VehicleRentalsModule } from '@/modules/vehicle-rentals/vehicle-rentals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    VehiclesModule,
    DemandsModule,
    OrdersModule,
    AdminModule,
    PlatformModule,
    HomeModule,
    NotificationsModule,
    CancellationsModule,
    AddressBooksModule,
    FavoriteRoutesModule,
    AccountSettingsModule,
    FareCalculationModule,
    DemandTemplatesModule,
    DemandSchedulesModule,
    ScheduleServiceModule,
    VehicleRentalsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
