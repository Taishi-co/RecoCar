import request from '@/utils/request'

export interface Order {
  id: string
  demand_id: string
  merchant_id: string
  merchant_nickname?: string
  owner_id: string
  owner_nickname?: string
  vehicle_id: string
  status: string
  created_at: string
}

export interface GetOrdersParams {
  status?: string
  page?: number
  pageSize?: number
}

export interface OrdersResponse {
  list: Order[]
  total: number
  page: number
  pageSize: number
}

export function getOrders(params: GetOrdersParams) {
  return request.get<any, OrdersResponse>('/admin/orders', { params })
}
