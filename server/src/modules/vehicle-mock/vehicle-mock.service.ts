import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface NeolixVehicleLocation {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  battery_level: number;
  status: 'idle' | 'running' | 'charging' | 'maintenance' | 'error';
  mileage: number;
}

export interface NinebotVehicleLocation {
  vehicle_sn: string;
  gps: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  motion: {
    speed: number;
    direction: number;
  };
  status: 'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE' | 'ERROR';
  battery: number;
  mileage: number;
  updated_at: number;
}

@Injectable()
export class VehicleMockService {
  private readonly logger = new Logger(VehicleMockService.name);

  // 模拟的新石器车辆（唐山附近）
  private neolixVehicles = [
    { id: 'NL-TS-001', baseLat: 39.6304, baseLng: 118.1802 }, // 唐山市中心
  ];

  // 模拟的九识车辆（唐山附近）
  private ninebotVehicles = [
    { sn: 'NB-TS-001', baseLat: 39.6500, baseLng: 118.2000 }, // 唐山北部
  ];

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * 获取新石器车辆实时位置
   */
  getNeolixLocation(vehicleId: string): NeolixVehicleLocation | null {
    const vehicle = this.neolixVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;

    // 模拟位置变化（添加随机偏移）
    const latOffset = (Math.random() - 0.5) * 0.001;
    const lngOffset = (Math.random() - 0.5) * 0.001;

    const statuses: Array<'idle' | 'running' | 'charging' | 'maintenance' | 'error'> =
      ['idle', 'running', 'running', 'running', 'charging', 'maintenance'];

    return {
      vehicle_id: vehicle.id,
      latitude: vehicle.baseLat + latOffset,
      longitude: vehicle.baseLng + lngOffset,
      altitude: 45 + Math.random() * 10,
      speed: Math.random() * 30,
      heading: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString(),
      battery_level: Math.floor(60 + Math.random() * 40),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      mileage: 1000 + Math.floor(Math.random() * 500),
    };
  }

  /**
   * 获取所有新石器车辆位置
   */
  getAllNeolixLocations(): NeolixVehicleLocation[] {
    return this.neolixVehicles.map(v => this.getNeolixLocation(v.id)!);
  }

  /**
   * 获取九识车辆实时位置
   */
  getNinebotLocation(vehicleSn: string): NinebotVehicleLocation | null {
    const vehicle = this.ninebotVehicles.find(v => v.sn === vehicleSn);
    if (!vehicle) return null;

    // 模拟位置变化（添加随机偏移）
    const latOffset = (Math.random() - 0.5) * 0.001;
    const lngOffset = (Math.random() - 0.5) * 0.001;

    const statuses: Array<'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE' | 'ERROR'> =
      ['IDLE', 'DELIVERING', 'DELIVERING', 'DELIVERING', 'CHARGING', 'MAINTENANCE'];

    return {
      vehicle_sn: vehicle.sn,
      gps: {
        lat: vehicle.baseLat + latOffset,
        lng: vehicle.baseLng + lngOffset,
        accuracy: 5 + Math.floor(Math.random() * 10),
      },
      motion: {
        speed: Math.random() * 25,
        direction: Math.floor(Math.random() * 360),
      },
      status: statuses[Math.floor(Math.random() * statuses.length)],
      battery: Math.floor(50 + Math.random() * 50),
      mileage: 800 + Math.floor(Math.random() * 400),
      updated_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * 获取所有九识车辆位置
   */
  getAllNinebotLocations(): NinebotVehicleLocation[] {
    return this.ninebotVehicles.map(v => this.getNinebotLocation(v.sn)!);
  }

  /**
   * 模拟实时推送（每5秒推送一次）
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async mockRealtimePush() {
    try {
      // 随机推送一辆新石器车辆数据
      const randomNeolix = this.neolixVehicles[Math.floor(Math.random() * this.neolixVehicles.length)];
      const neolixData = this.getNeolixLocation(randomNeolix.id);

      if (neolixData) {
        this.eventEmitter.emit('vehicle.location.update', {
          source: 'neolix',
          data: neolixData,
        });
        this.logger.debug(`[模拟] 新石器车辆 ${neolixData.vehicle_id} 位置更新`);
      }

      // 随机推送一辆九识车辆数据
      const randomNinebot = this.ninebotVehicles[Math.floor(Math.random() * this.ninebotVehicles.length)];
      const ninebotData = this.getNinebotLocation(randomNinebot.sn);

      if (ninebotData) {
        this.eventEmitter.emit('vehicle.location.update', {
          source: 'ninebot',
          data: ninebotData,
        });
        this.logger.debug(`[模拟] 九识车辆 ${ninebotData.vehicle_sn} 位置更新`);
      }
    } catch (error) {
      this.logger.error('模拟推送失败:', error);
    }
  }
}
