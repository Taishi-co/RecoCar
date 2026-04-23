import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator'

// 地理编码请求DTO
export class GeocodeDto {
  @IsString()
  address: string

  @IsOptional()
  @IsString()
  city?: string
}

// 距离计算请求DTO
export class DistanceDto {
  @IsString()
  origin: string // 格式: "longitude,latitude"

  @IsString()
  destination: string // 格式: "longitude,latitude"

  @IsOptional()
  @IsEnum(['0', '1', '3'])
  type?: string = '1' // 0:直线距离, 1:驾车距离, 3:步行距离
}

// 路径规划请求DTO
export class RouteDto {
  @IsString()
  origin: string // 格式: "longitude,latitude"

  @IsString()
  destination: string // 格式: "longitude,latitude"

  @IsOptional()
  @IsEnum(['1', '2', '3', '4'])
  strategy?: string = '1' // 1:速度优先, 2:费用优先, 3:距离优先, 4:不走高速

  @IsOptional()
  @IsString()
  extensions?: string = 'base' // base:返回基础信息, all:返回详细信息
}

// 获取订单地图信息请求DTO
export class OrderMapDto {
  @IsString()
  orderId: string
}
