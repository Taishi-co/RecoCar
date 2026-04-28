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
import AllocateVehicleDialog from './AllocateVehicleDialog'
import './index.css'

interface Demand {
  id: string
  status: string
  pickup_point_info: any
  delivery_points: any[]
  cargo_info: any
  time_window: any
  vehicle_source: string
  created_at: string
  vehicle_allocation?: any
}

interface DemandStats {
  pending: number
  in_transit: number
  completed: number
  cancelled: number
  total: number
}

interface Vehicle {
  id: string
  vehicle_code: string
  vehicle_type: string
  load_capacity: number
  current_location: string
  usage_mode: string
  trip_status: string
}

const EnterpriseDispatchPage: FC = () => {
  const [pendingDemands, setPendingDemands] = useState<Demand[]>([])
  const [inTransitDemands, setInTransitDemands] = useState<Demand[]>([])
  const [completedDemands, setCompletedDemands] = useState<Demand[]>([])
  const [stats, setStats] = useState<DemandStats | null>(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [allocatingDemand, setAllocatingDemand] = useState<Demand | null>(null)
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
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

      const enterpriseRes = await Network.request({
        url: `/api/enterprise/admin/${userInfo.id}`,
      })

      if (enterpriseRes.data.code === 200) {
        const entId = enterpriseRes.data.data.id
        setEnterpriseId(entId)
        loadStats(entId)
        loadPendingDemands(entId)
        loadInTransitDemands(entId)
        loadCompletedDemands(entId)
      }
    } catch (error) {
      console.error('加载企业信息失败:', error)
    }
  }

  const loadStats = async (entId: string) => {
    try {
      const res = await Network.request({
        url: '/api/demand/stats/enterprise',
        data: { enterprise_id: entId },
      })

      if (res.data.code === 200) {
        setStats(res.data.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  const loadPendingDemands = async (entId: string) => {
    try {
      const res = await Network.request({
        url: `/api/demand/pending/${entId}`,
      })

      if (res.data.code === 200) {
        setPendingDemands(res.data.data || [])
      }
    } catch (error) {
      console.error('加载待调度订单失败:', error)
    }
  }

  const loadInTransitDemands = async (entId: string) => {
    try {
      const res = await Network.request({
        url: '/api/demand',
        data: { enterpriseId: entId, status: 'in_transit' },
      })

      if (res.data.code === 200) {
        setInTransitDemands(res.data.data.list || [])
      }
    } catch (error) {
      console.error('加载进行中订单失败:', error)
    }
  }

  const loadCompletedDemands = async (entId: string) => {
    try {
      const res = await Network.request({
        url: '/api/demand',
        data: { enterpriseId: entId, status: 'completed' },
      })

      if (res.data.code === 200) {
        setCompletedDemands(res.data.data.list || [])
      }
    } catch (error) {
      console.error('加载已完成订单失败:', error)
    }
  }

  const handleAllocateVehicle = async (demand: Demand) => {
    try {
      // 获取可用车辆
      const res = await Network.request({
        url: '/api/enterprise-vehicles',
        data: { enterprise_id: enterpriseId },
      })

      if (res.data.code === 200) {
        const vehicles = res.data.data || []
        // 只显示空闲车辆
        setAvailableVehicles(vehicles.filter((v: Vehicle) => v.trip_status === 'idle'))
        setSelectedVehicleIds([])
        setAllocatingDemand(demand)
        setAllocateDialogOpen(true)
      }
    } catch (error) {
      console.error('获取车辆列表失败:', error)
      Taro.showToast({
        title: '获取车辆列表失败',
        icon: 'none',
      })
    }
  }

  const handleToggleVehicle = (vehicleId: string) => {
    setSelectedVehicleIds(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId)
      } else {
        return [...prev, vehicleId]
      }
    })
  }

  const handleConfirmAllocate = async () => {
    if (!allocatingDemand || selectedVehicleIds.length === 0) {
      return
    }

    try {
      const res = await Network.request({
        url: `/api/demand/${allocatingDemand.id}/allocate`,
        method: 'PUT',
        data: {
          vehicle_allocation: {
            vehicle_ids: selectedVehicleIds,
            allocated_at: new Date().toISOString(),
          },
        },
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: '分配成功',
          icon: 'success',
        })
        setAllocateDialogOpen(false)
        // 刷新订单列表
        loadPendingDemands(enterpriseId)
        loadInTransitDemands(enterpriseId)
        loadStats(enterpriseId)
      } else {
        Taro.showToast({
          title: res.data.message || '分配失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('分配车辆失败:', error)
      Taro.showToast({
        title: '分配失败',
        icon: 'none',
      })
    }
  }

  const handleViewDetail = (demandId: string) => {
    console.log('查看详情:', demandId)
    Taro.showToast({
      title: '详情功能开发中',
      icon: 'none',
    })
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: '待调度',
      in_transit: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'bg-orange-100 text-orange-600',
      in_transit: 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
      cancelled: 'bg-gray-100 text-gray-600',
    }
    return colorMap[status] || ''
  }

  const renderDemandCard = (demand: Demand) => (
    <Card key={demand.id} className="mb-4">
      <CardHeader>
        <View className="flex justify-between items-center">
          <CardTitle className="text-base flex-1">
            {demand.cargo_info.type || '配送订单'} - {demand.cargo_info.quantity}箱
          </CardTitle>
          <Text className={`text-xs px-2 py-1 rounded ${getStatusColor(demand.status)}`}>
            {getStatusText(demand.status)}
          </Text>
        </View>
      </CardHeader>
      <CardContent>
        <View className="text-sm text-gray-600 mb-3">
          <Text className="block mb-1">
            📍 起点：{demand.pickup_point_info?.name || '仓库'} - {demand.pickup_point_info?.address}
          </Text>
          {demand.delivery_points && demand.delivery_points.length > 0 && (
            <Text className="block mb-1">
              📦 配送点：{demand.delivery_points.map(p => p.name).join('、')}
            </Text>
          )}
          <Text className="block">
            ⏰ 时间窗口：{demand.time_window?.start?.split(' ')[1]} - {demand.time_window?.end?.split(' ')[1]}
          </Text>
        </View>

        <View className="flex gap-2">
          {demand.status === 'pending' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleAllocateVehicle(demand)}
            >
              <Text className="text-xs">分配车辆</Text>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleViewDetail(demand.id)}
          >
            <Text className="text-xs">查看详情</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  )

  return (
    <View className="enterprise-dispatch min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-full">
        <View className="p-4">
          {/* 统计信息 */}
          {stats && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <View className="grid grid-cols-4 gap-2">
                  <View className="text-center">
                    <Text className="text-xl font-bold text-orange-600 block">
                      {stats.pending}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">待调度</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-xl font-bold text-blue-600 block">
                      {stats.in_transit}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">进行中</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-xl font-bold text-green-600 block">
                      {stats.completed}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">已完成</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-xl font-bold text-gray-600 block">
                      {stats.total}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1 block">总计</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 订单列表 */}
          <View className="flex gap-2 mb-4">
            <View
              className={`flex-1 py-2 px-3 rounded-lg text-center ${activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveTab('pending')}
            >
              <Text className="text-sm">待调度</Text>
            </View>
            <View
              className={`flex-1 py-2 px-3 rounded-lg text-center ${activeTab === 'in_transit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveTab('in_transit')}
            >
              <Text className="text-sm">进行中</Text>
            </View>
            <View
              className={`flex-1 py-2 px-3 rounded-lg text-center ${activeTab === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
              onClick={() => setActiveTab('completed')}
            >
              <Text className="text-sm">已完成</Text>
            </View>
          </View>

          {activeTab === 'pending' && (
            <View>
              {pendingDemands.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Text className="text-gray-500 text-sm">暂无待调度订单</Text>
                  </CardContent>
                </Card>
              ) : (
                pendingDemands.map(demand => renderDemandCard(demand))
              )}
            </View>
          )}

          {activeTab === 'in_transit' && (
            <View>
              {inTransitDemands.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Text className="text-gray-500 text-sm">暂无进行中订单</Text>
                  </CardContent>
                </Card>
              ) : (
                inTransitDemands.map(demand => renderDemandCard(demand))
              )}
            </View>
          )}

          {activeTab === 'completed' && (
            <View>
              {completedDemands.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Text className="text-gray-500 text-sm">暂无已完成订单</Text>
                  </CardContent>
                </Card>
              ) : (
                completedDemands.map(demand => renderDemandCard(demand))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 分配车辆弹窗 */}
      <AllocateVehicleDialog
        open={allocateDialogOpen}
        onClose={() => setAllocateDialogOpen(false)}
        vehicles={availableVehicles}
        selectedVehicles={selectedVehicleIds}
        onToggleVehicle={handleToggleVehicle}
        onConfirm={handleConfirmAllocate}
      />
    </View>
  )
}

export default EnterpriseDispatchPage
