import { IsString, IsOptional, IsDateString, IsEnum, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateProfileDto {
  @ApiProperty({ description: '头像地址', required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string

  @ApiProperty({ description: '昵称', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nickname?: string

  @ApiProperty({ description: '性别', enum: ['male', 'female', 'secret'], required: false })
  @IsOptional()
  @IsEnum(['male', 'female', 'secret'])
  gender?: 'male' | 'female' | 'secret'

  @ApiProperty({ description: '出生日期', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: string
}

export class ChangePhoneDto {
  @ApiProperty({ description: '短信验证码' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  code: string

  @ApiProperty({ description: '新手机号' })
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  newPhone: string
}

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  oldPassword: string

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string
}

export class SendSmsCodeDto {
  @ApiProperty({ description: '手机号' })
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  phone: string

  @ApiProperty({ description: '操作类型', enum: ['change_phone', 'bind_phone', 'register', 'login'] })
  @IsEnum(['change_phone', 'bind_phone', 'register', 'login'])
  type: 'change_phone' | 'bind_phone' | 'register' | 'login'
}
