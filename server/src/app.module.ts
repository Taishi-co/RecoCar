import { Module } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, VehiclesModule, DemandsModule, OrdersModule, AdminModule, PlatformModule, HomeModule, NotificationsModule, CancellationsModule, AddressBooksModule, FavoriteRoutesModule, AccountSettingsModule, FareCalculationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
