import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './index.css'

interface Vehicle {
  id: string
  vehicle_code: string
  vehicle_type: string
  load_capacity: number
  current_location: string
  usage_mode: 'internal' | 'external' | 'both'
  trip_status: string
  today_internal_orders: number
  today_external_orders: number
  today_distance: number
  created_at: string
}

interface VehicleStats {
  total: number
  in_transit: number
  idle: number
  internal: number
  external: number
  both: number
}

const EnterpriseFleetPage: FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<VehicleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [enterpriseId, setEnterpriseId] = useState('')

  useEffect(() => {
    loadEnterpriseInfo()
  }, [])

  const loadEnterpriseInfo = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo) {
        Taro.redirectTo({ url: '/pages/index/index' })
        return
      }

      // 获取企业信息
      const enterpriseRes = await Network.request({
        url: `/api/enterprise/admin/${userInfo.id}`,
      })

      if (enterpriseRes.data.code === 200) {
        const entId = enterpriseRes.data.data.id
        setEnterpriseId(entId)
        loadVehicles(entId)
        loadStats(entId)
      } else {
        Taro.showToast({
          title: '获取企业信息失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('加载企业信息失败:', error)
    }
  }

  const loadVehicles = async (entId: string) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/enterprise-vehicles',
        data: { enterprise_id: entId },
      })

      console.log('车辆列表响应:', res.data)

      if (res.data.code === 200) {
        setVehicles(res.data.data || [])
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (entId: string) => {
    try {
      const res = await Network.request({
        url: '/api/enterprise-vehicles/stats',
        data: { enterprise_id: entId },
      })

      console.log('车辆统计响应:', res.data)

      if (res.data.code === 200) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  }

  const handleUpdateUsageMode = async (vehicleId: string, newMode: 'internal' | 'external' | 'both') => {
    try {
      const res = await Network.request({
        url: `/api/enterprise-vehicles/${vehicleId}/usage-mode`,
        method: 'PUT',
        data: { usage_mode: newMode },
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: '更新成功',
          icon: 'success',
        })
        loadVehicles(enterpriseId)
        loadStats(enterpriseId)
      } else {
        Taro.showToast({
          title: res.data.message || '更新失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('更新失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none',
      })
    }
  }

  const getUsageModeText = (mode: string) => {
    const modeMap = {
      internal: '内部',
      external: '对外',
      both: '内外',
    }
    return modeMap[mode] || mode
  }

  const getTripStatusText = (status: string) => {
    const statusMap = {
      idle: '空闲',
      in_transit: '执行中',
      maintenance: '维护中',
    }
    return statusMap[status] || status
  }

  return (
    <View className="enterprise-fleet min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-full">
        <View className="p-4">
          {/* 统计信息 */}
          {stats && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-blue-600 block">
                      {stats.total}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">总车辆</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-orange-600 block">
                      {stats.in_transit}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">执行中</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-green-600 block">
                      {stats.idle}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">空闲</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-purple-600 block">
                      {stats.external}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">对外接单</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 车辆列表 */}
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-gray-500">加载中...</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <Text className="text-gray-500 text-sm block">暂无车辆</Text>
              </CardContent>
            </Card>
          ) : (
            vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="mb-4">
                <CardHeader>
                  <View className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      {vehicle.vehicle_code} {vehicle.vehicle_type}
                    </CardTitle>
                    <Text className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                      {getUsageModeText(vehicle.usage_mode)}
                    </Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="text-sm text-gray-600 mb-3">
                    <Text className="block">
                      车牌：{vehicle.vehicle_code}
                    </Text>
                    <Text className="block">
                      载重：{vehicle.load_capacity}吨
                    </Text>
                    <Text className="block">
                      状态：{getTripStatusText(vehicle.trip_status)}
                    </Text>
                    <Text className="block">
                      位置：{vehicle.current_location}
                    </Text>
                  </View>

                  <Text className="text-sm font-medium text-gray-900 mb-2 block">
                    今日统计：
                  </Text>
                  <View className="text-xs text-gray-600 mb-3">
                    <Text className="block">
                      - 内部订单：{vehicle.today_internal_orders || 0}单
                    </Text>
                    <Text className="block">
                      - 外部订单：{vehicle.today_external_orders || 0}单
                    </Text>
                    <Text className="block">
                      - 总行驶：{vehicle.today_distance || 0}km
                    </Text>
                  </View>

                  <View className="flex gap-2 flex-wrap">
                    {vehicle.usage_mode !== 'internal' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleUpdateUsageMode(vehicle.id, 'internal')}
                      >
                        <Text className="text-xs">设为内部</Text>
                      </Button>
                    )}
                    {vehicle.usage_mode !== 'external' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleUpdateUsageMode(vehicle.id, 'external')}
                      >
                        <Text className="text-xs">设为对外</Text>
                      </Button>
                    )}
                    {vehicle.usage_mode !== 'both' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleUpdateUsageMode(vehicle.id, 'both')}
                      >
                        <Text className="text-xs">设为内外</Text>
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default EnterpriseFleetPage
