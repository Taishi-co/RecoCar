import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  trip_status: 'idle' | 'in_transit' | 'maintenance'
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
  const [activeTab, setActiveTab] = useState('all')

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

  const handleUpdateStatus = async (vehicleId: string, newStatus: 'idle' | 'in_transit' | 'maintenance') => {
    try {
      const res = await Network.request({
        url: `/api/enterprise-vehicles/${vehicleId}/status`,
        method: 'PUT',
        data: { trip_status: newStatus },
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

  const handleDeleteVehicle = async (vehicleId: string, vehicleCode: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确认删除车辆"${vehicleCode}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const deleteRes = await Network.request({
              url: `/api/enterprise-vehicles/${vehicleId}`,
              method: 'DELETE',
            })

            if (deleteRes.data.code === 200) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
              })
              loadVehicles(enterpriseId)
              loadStats(enterpriseId)
            } else {
              Taro.showToast({
                title: deleteRes.data.message || '删除失败',
                icon: 'none',
              })
            }
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({
              title: '删除失败',
              icon: 'none',
            })
          }
        }
      },
    })
  }

  const handleViewDetail = (vehicleId: string) => {
    Taro.navigateTo({
      url: `/pages/enterprise/fleet/detail/index?id=${vehicleId}`,
    })
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

  const getTripStatusColor = (status: string) => {
    const colorMap = {
      idle: 'bg-green-100 text-green-600',
      in_transit: 'bg-orange-100 text-orange-600',
      maintenance: 'bg-red-100 text-red-600',
    }
    return colorMap[status] || ''
  }

  // 筛选车辆
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (activeTab === 'all') return true
    if (activeTab === 'own') return vehicle.usage_mode === 'internal'
    if (activeTab === 'external') return vehicle.usage_mode === 'external' || vehicle.usage_mode === 'both'
    return true
  })

  return (
    <View className="enterprise-fleet min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-full">
        <View className="p-4">
          {/* 统计信息 */}
          {stats && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <View className="grid grid-cols-4 gap-2">
                  <View className="text-center">
                    <Text className="text-lg font-bold text-blue-600 block">
                      {stats.total}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">总车辆</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-lg font-bold text-orange-600 block">
                      {stats.in_transit}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">执行中</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-lg font-bold text-green-600 block">
                      {stats.idle}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">空闲</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-lg font-bold text-purple-600 block">
                      {stats.external}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">对外</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 车辆筛选 */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                <Text>全部</Text>
              </TabsTrigger>
              <TabsTrigger value="own">
                <Text>自有</Text>
              </TabsTrigger>
              <TabsTrigger value="external">
                <Text>外部</Text>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 车辆列表 */}
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-gray-500">加载中...</Text>
            </View>
          ) : filteredVehicles.length === 0 ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <Text className="text-gray-500 text-sm block">暂无车辆</Text>
              </CardContent>
            </Card>
          ) : (
            filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="mb-3">
                <CardContent className="p-4">
                  <View className="flex justify-between items-start mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-base font-bold text-gray-900">
                          {vehicle.vehicle_code}
                        </Text>
                        <Badge className={getTripStatusColor(vehicle.trip_status)}>
                          {getTripStatusText(vehicle.trip_status)}
                        </Badge>
                        <Badge variant="outline">
                          {getUsageModeText(vehicle.usage_mode)}
                        </Badge>
                      </View>
                      <Text className="text-sm text-gray-600">
                        {vehicle.vehicle_type} · {vehicle.load_capacity}吨
                      </Text>
                    </View>
                  </View>

                  <View className="text-xs text-gray-600 mb-3">
                    <Text className="block">
                      位置：{vehicle.current_location}
                    </Text>
                    <Text className="block">
                      今日订单：{vehicle.today_internal_orders + vehicle.today_external_orders}单 · {vehicle.today_distance}km
                    </Text>
                  </View>

                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetail(vehicle.id)}
                    >
                      <Text className="text-xs">详情</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const statuses = ['idle', 'in_transit', 'maintenance'] as const
                        const currentIndex = statuses.indexOf(vehicle.trip_status)
                        const nextIndex = (currentIndex + 1) % statuses.length
                        handleUpdateStatus(vehicle.id, statuses[nextIndex])
                      }}
                    >
                      <Text className="text-xs">切换状态</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVehicle(vehicle.id, vehicle.vehicle_code)}
                    >
                      <Text className="text-xs">删除</Text>
                    </Button>
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
