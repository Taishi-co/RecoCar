import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: {
    id: string
    username: string
    role: string
  }
}

export function login(data: LoginParams) {
  return request.post<any, LoginResponse>('/admin/login', data)
}

export function logout() {
  return request.post('/admin/logout')
}

export function getAdminInfo() {
  return request.get('/admin/info')
}
