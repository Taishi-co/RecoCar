import request from '@/utils/request'

export interface User {
  id: string
  username: string
  nickname: string
  phone: string
  role: string
  status: string
  created_at: string
}

export interface GetUsersParams {
  role?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface UsersResponse {
  list: User[]
  total: number
  page: number
  pageSize: number
}

export function getUsers(params: GetUsersParams) {
  return request.get<any, UsersResponse>('/admin/users', { params })
}

export function updateUserStatus(id: string, status: string) {
  return request.put(`/admin/users/${id}/status`, { status })
}
