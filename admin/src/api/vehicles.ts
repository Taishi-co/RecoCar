import request from '@/utils/request'

export interface Vehicle {
  id: string
  owner_id: string
  owner_nickname?: string
  vehicle_type: string
  license_plate: string
  load_capacity: number
  volume: number
  battery_life: number
  has_cold_chain: boolean
  status: string
  remarks: string | null
  created_at: string
}

export interface GetVehiclesParams {
  status?: string
  page?: number
  pageSize?: number
}

export interface VehiclesResponse {
  list: Vehicle[]
  total: number
  page: number
  pageSize: number
}

export function getVehicles(params: GetVehiclesParams) {
  return request.get<any, VehiclesResponse>('/admin/vehicles', { params })
}

export function reviewVehicle(id: string, data: { status: string; remarks?: string }) {
  return request.put(`/admin/vehicles/${id}/review`, data)
}
