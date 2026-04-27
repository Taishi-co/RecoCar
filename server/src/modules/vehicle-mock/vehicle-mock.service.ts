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

  // 存储车辆历史轨迹（内存中，最多保留100个点）
  private vehicleTrajectories = new Map<string, Array<{lat: number, lng: number, time: number}>>();

  // 当前车辆状态（用于连续移动）
  private vehicleStates = new Map<string, {lat: number, lng: number, heading: number}>();

  constructor(private eventEmitter: EventEmitter2) {
    // 初始化车辆状态
    this.neolixVehicles.forEach(v => {
      this.vehicleStates.set(v.id, { lat: v.baseLat, lng: v.baseLng, heading: Math.random() * 360 });
    });
    this.ninebotVehicles.forEach(v => {
      this.vehicleStates.set(v.sn, { lat: v.baseLat, lng: v.baseLng, heading: Math.random() * 360 });
    });
  }

  /**
   * 获取新石器车辆实时位置
   */
  getNeolixLocation(vehicleId: string): NeolixVehicleLocation | null {
    const vehicle = this.neolixVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;

    // 获取或初始化车辆状态
    let state = this.vehicleStates.get(vehicleId);
    if (!state) {
      state = { lat: vehicle.baseLat, lng: vehicle.baseLng, heading: Math.random() * 360 };
      this.vehicleStates.set(vehicleId, state);
    }

    // 模拟连续移动：速度更快（30-60 km/h）
    const speedKmh = 30 + Math.random() * 30; // 30-60 km/h
    const speedMs = speedKmh * 1000 / 3600; // 转换为 m/s
    const distance = speedMs * 5; // 5秒移动的距离

    // 随机改变方向（但不会大幅改变）
    const headingChange = (Math.random() - 0.5) * 60; // -30到30度
    state.heading = (state.heading + headingChange + 360) % 360;

    // 计算新位置
    const headingRad = state.heading * Math.PI / 180;
    const latChange = (distance / 111000) * Math.cos(headingRad); // 1度纬度约111km
    const lngChange = (distance / (111000 * Math.cos(state.lat * Math.PI / 180))) * Math.sin(headingRad);

    state.lat += latChange;
    state.lng += lngChange;

    // 限制在基准坐标附近5公里范围内
    const maxOffset = 0.045; // 约5公里
    state.lat = Math.max(vehicle.baseLat - maxOffset, Math.min(vehicle.baseLat + maxOffset, state.lat));
    state.lng = Math.max(vehicle.baseLng - maxOffset, Math.min(vehicle.baseLng + maxOffset, state.lng));

    // 保存到历史轨迹
    this.saveTrajectory(vehicleId, state.lat, state.lng);

    const statuses: Array<'idle' | 'running' | 'charging' | 'maintenance' | 'error'> =
      ['idle', 'running', 'running', 'running', 'charging', 'maintenance'];

    return {
      vehicle_id: vehicle.id,
      latitude: state.lat,
      longitude: state.lng,
      altitude: 45 + Math.random() * 10,
      speed: speedKmh,
      heading: Math.floor(state.heading),
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

    // 获取或初始化车辆状态
    let state = this.vehicleStates.get(vehicleSn);
    if (!state) {
      state = { lat: vehicle.baseLat, lng: vehicle.baseLng, heading: Math.random() * 360 };
      this.vehicleStates.set(vehicleSn, state);
    }

    // 模拟连续移动：速度更快（30-60 km/h）
    const speedKmh = 30 + Math.random() * 30; // 30-60 km/h
    const speedMs = speedKmh * 1000 / 3600; // 转换为 m/s
    const distance = speedMs * 5; // 5秒移动的距离

    // 随机改变方向（但不会大幅改变）
    const headingChange = (Math.random() - 0.5) * 60; // -30到30度
    state.heading = (state.heading + headingChange + 360) % 360;

    // 计算新位置
    const headingRad = state.heading * Math.PI / 180;
    const latChange = (distance / 111000) * Math.cos(headingRad); // 1度纬度约111km
    const lngChange = (distance / (111000 * Math.cos(state.lat * Math.PI / 180))) * Math.sin(headingRad);

    state.lat += latChange;
    state.lng += lngChange;

    // 限制在基准坐标附近5公里范围内
    const maxOffset = 0.045; // 约5公里
    state.lat = Math.max(vehicle.baseLat - maxOffset, Math.min(vehicle.baseLat + maxOffset, state.lat));
    state.lng = Math.max(vehicle.baseLng - maxOffset, Math.min(vehicle.baseLng + maxOffset, state.lng));

    // 保存到历史轨迹
    this.saveTrajectory(vehicleSn, state.lat, state.lng);

    const statuses: Array<'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE' | 'ERROR'> =
      ['IDLE', 'DELIVERING', 'DELIVERING', 'DELIVERING', 'CHARGING', 'MAINTENANCE'];

    return {
      vehicle_sn: vehicle.sn,
      gps: {
        lat: state.lat,
        lng: state.lng,
        accuracy: 5 + Math.floor(Math.random() * 10),
      },
      motion: {
        speed: speedKmh,
        direction: Math.floor(state.heading),
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

  /**
   * 保存轨迹点
   */
  private saveTrajectory(vehicleId: string, lat: number, lng: number) {
    const trajectory = this.vehicleTrajectories.get(vehicleId) || [];
    trajectory.push({
      lat,
      lng,
      time: Date.now()
    });

    // 最多保留100个点（约8-9分钟的历史）
    if (trajectory.length > 100) {
      trajectory.shift();
    }

    this.vehicleTrajectories.set(vehicleId, trajectory);
  }

  /**
   * 获取车辆历史轨迹
   */
  getVehicleTrajectory(vehicleId: string): Array<{lat: number, lng: number, time: number}> {
    return this.vehicleTrajectories.get(vehicleId) || [];
  }

  /**
   * 获取所有车辆轨迹
   */
  getAllTrajectories(): Record<string, Array<{lat: number, lng: number, time: number}>> {
    const result: Record<string, Array<{lat: number, lng: number, time: number}>> = {};
    this.vehicleTrajectories.forEach((trajectory, vehicleId) => {
      result[vehicleId] = trajectory;
    });
    return result;
  }
}
