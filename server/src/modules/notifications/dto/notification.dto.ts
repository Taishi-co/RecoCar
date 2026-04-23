import { IsString, IsOptional, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateNotificationDto {
  @ApiProperty({ description: '用户ID' })
  @IsUUID()
  userId: string

  @ApiProperty({ description: '通知类型' })
  @IsString()
  type: string

  @ApiProperty({ description: '通知标题' })
  @IsString()
  title: string

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string

  @ApiProperty({ description: '关联订单ID', required: false })
  @IsOptional()
  @IsUUID()
  relatedOrderId?: string

  @ApiProperty({ description: '关联需求ID', required: false })
  @IsOptional()
  @IsUUID()
  relatedDemandId?: string
}
