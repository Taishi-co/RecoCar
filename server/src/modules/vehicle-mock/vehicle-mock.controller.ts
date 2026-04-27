import { Controller, Get, Query } from '@nestjs/common';
import { VehicleMockService, NeolixVehicleLocation, NinebotVehicleLocation } from './vehicle-mock.service';

@Controller('mock')
export class VehicleMockController {
  constructor(private readonly vehicleMockService: VehicleMockService) {}

  /**
   * 获取新石器车辆位置
   * GET /api/mock/neolix/:vehicleId
   */
  @Get('neolix/:vehicleId')
  getNeolixLocation(@Query('vehicleId') vehicleId: string) {
    const data = this.vehicleMockService.getNeolixLocation(vehicleId);
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  /**
   * 获取所有新石器车辆位置
   * GET /api/mock/neolix/all
   */
  @Get('neolix/all')
  getAllNeolixLocations() {
    const data = this.vehicleMockService.getAllNeolixLocations();
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  /**
   * 获取九识车辆位置
   * GET /api/mock/ninebot/:vehicleSn
   */
  @Get('ninebot/:vehicleSn')
  getNinebotLocation(@Query('vehicleSn') vehicleSn: string) {
    const data = this.vehicleMockService.getNinebotLocation(vehicleSn);
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  /**
   * 获取所有九识车辆位置
   * GET /api/mock/ninebot/all
   */
  @Get('ninebot/all')
  getAllNinebotLocations() {
    const data = this.vehicleMockService.getAllNinebotLocations();
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  /**
   * 获取所有模拟车辆数据（新石器 + 九识）
   * GET /api/mock/vehicles/all
   */
  @Get('vehicles/all')
  getAllMockVehicles() {
    const neolixData = this.vehicleMockService.getAllNeolixLocations();
    const ninebotData = this.vehicleMockService.getAllNinebotLocations();

    // 统一格式转换
    const unified = [
      ...neolixData.map(item => ({
        id: item.vehicle_id,
        manufacturer: 'neolix',
        latitude: item.latitude,
        longitude: item.longitude,
        speed: item.speed,
        heading: item.heading,
        status: item.status,
        battery: item.battery_level,
        mileage: item.mileage,
        timestamp: item.timestamp,
      })),
      ...ninebotData.map(item => ({
        id: item.vehicle_sn,
        manufacturer: 'ninebot',
        latitude: item.gps.lat,
        longitude: item.gps.lng,
        speed: item.motion.speed,
        heading: item.motion.direction,
        status: item.status.toLowerCase(),
        battery: item.battery,
        mileage: item.mileage,
        timestamp: new Date(item.updated_at * 1000).toISOString(),
      })),
    ];

    return {
      code: 200,
      message: 'success',
      data: unified,
    };
  }
}
