import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { VehiclesModule } from '@/modules/vehicles/vehicles.module';
import { DemandsModule } from '@/modules/demands/demands.module';
import { OrdersModule } from '@/modules/orders/orders.module';

@Module({
  imports: [AuthModule, VehiclesModule, DemandsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
