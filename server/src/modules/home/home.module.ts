import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { HomeController } from './home.controller'
import { HomeService } from './home.service'

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // 使用内存存储，便于上传到对象存储
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    })
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService]
})
export class HomeModule {}
