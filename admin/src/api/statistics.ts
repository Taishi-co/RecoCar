import request from '@/utils/request'

export interface Statistics {
  total_users: number
  total_vehicles: number
  total_orders: number
  total_revenue: number
  users_by_role: {
    merchant: number
    owner: number
  }
  orders_by_status: {
    pending: number
    accepted: number
    in_transit: number
    completed: number
    cancelled: number
  }
  recent_orders: any[]
}

export function getStatistics() {
  return request.get<any, Statistics>('/admin/statistics')
}
