import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api', // 通过 vite proxy 代理到后端
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[Request]', config.method?.toUpperCase(), config.url, config.data || config.params)
    return config
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    console.log('[Response]', response.config.url, res)

    // 根据后端返回的统一格式处理
    if (res.code === 200) {
      return res.data
    } else {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error: AxiosError) => {
    console.error('[Response Error]', error)

    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          message.error('未授权，请重新登录')
          localStorage.removeItem('admin_token')
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(error.message || '网络错误')
      }
    } else {
      message.error('网络连接失败')
    }

    return Promise.reject(error)
  }
)

export default service
