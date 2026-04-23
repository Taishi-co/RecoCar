import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Order {
  id: string
  demand_id: string
  vehicle_id: string | null
  merchant_id: string
  owner_id: string | null
  status: string
  pickup_time: string | null
  accept_time: string | null
  complete_time: string | null
  cancel_reason: string | null
  cancel_time: string | null
  fare_price: number | null
  merchant_confirmed: boolean
  confirm_time: string | null
  created_at: string
  demand?: {
    id: string
    cargo_name: string
    cargo_type: string
    weight: number
    volume: number
    pickup_time: string
    pickup_address: string
    delivery_address: string
    remarks: string | null
    status: string
  }
  vehicle?: {
    id: string
    brand: string
    model: string
    plate_number: string
    status: string
  }
  owner?: {
    id: string
    name: string
    phone: string
  }
}

export default function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'merchant') {
      Taro.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
      return
    }
    loadOrders()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [filterStatus])

  const loadOrders = async () => {
    setLoading(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')

      let url = `/api/orders?merchant_id=${userInfo.id}`
      if (filterStatus) {
        url += `&status=${filterStatus}`
      }

      const res = await Network.request({
        url,
        method: 'GET'
      })

      console.log('订单列表响应:', res.data)

      if (res.data.code === 200) {
        const orderList = res.data.data || []

        // 为每个订单查询需求详情
        const ordersWithDetails = await Promise.all(
          orderList.map(async (order: Order) => {
            try {
              const demandRes = await Network.request({
                url: `/api/demands/${order.demand_id}?id=${order.demand_id}`,
                method: 'GET'
              })

              if (demandRes.data.code === 200 && demandRes.data.data) {
                order.demand = demandRes.data.data
              }
            } catch (error) {
              console.error('查询需求详情失败:', error)
            }

            return order
          })
        )

        setOrders(ordersWithDetails)
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      pending: '待接单',
      accepted: '已接单',
      in_transit: '运输中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statuses[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-500',
      accepted: 'bg-blue-500',
      in_transit: 'bg-cyan-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const handleConfirmFare = async (orderId: string) => {
    try {
      const res = await Network.request({
        url: `/api/orders/${orderId}/confirm-fare?id=${orderId}`,
        method: 'POST'
      })

      console.log('确认运费响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '运费已确认',
          icon: 'success'
        })

        // 重新加载订单列表
        loadOrders()
      } else {
        Taro.showToast({
          title: res.data.message || '确认失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('确认运费失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }
  }

  const getCargoTypeText = (type: string) => {
    const types: Record<string, string> = {
      normal: '普通货物',
      fragile: '易碎品',
      refrigerated: '冷藏品',
      bulky: '大件货物',
      hazardous: '危险品'
    }
    return types[type] || type
  }

  const getCargoTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-blue-500',
      fragile: 'bg-orange-500',
      refrigerated: 'bg-cyan-500',
      bulky: 'bg-purple-500',
      hazardous: 'bg-red-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 导航菜单 */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-3">
          <View className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/index' })}
            >
              <Text className="text-xs">发布需求</Text>
            </Button>
            <Button
              size="sm"
              className="bg-blue-500"
            >
              <Text className="text-xs">订单管理</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/stats/index' })}
            >
              <Text className="text-xs">数据统计</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/profile/index' })}
            >
              <Text className="text-xs">我的</Text>
            </Button>
          </View>
        </View>
      </View>

      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                我的订单
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={loadOrders}
                disabled={loading}
              >
                <Text className="text-xs">刷新</Text>
              </Button>
            </View>
          </CardHeader>
          <CardContent>
            {/* 筛选条件 */}
            <View className="flex gap-2 mb-4 flex-wrap">
              <Button
                size="sm"
                variant={filterStatus === '' ? 'default' : 'outline'}
                className={filterStatus === '' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('')}
              >
                <Text className="text-xs">全部</Text>
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                className={filterStatus === 'pending' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('pending')}
              >
                <Text className="text-xs">待接单</Text>
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'accepted' ? 'default' : 'outline'}
                className={filterStatus === 'accepted' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('accepted')}
              >
                <Text className="text-xs">已接单</Text>
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'in_transit' ? 'default' : 'outline'}
                className={filterStatus === 'in_transit' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('in_transit')}
              >
                <Text className="text-xs">运输中</Text>
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                className={filterStatus === 'completed' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('completed')}
              >
                <Text className="text-xs">已完成</Text>
              </Button>
              <Button
                size="sm"
                variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
                className={filterStatus === 'cancelled' ? 'bg-blue-500' : ''}
                onClick={() => setFilterStatus('cancelled')}
              >
                <Text className="text-xs">已取消</Text>
              </Button>
            </View>

            {loading ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm">加载中...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm mb-4">暂无订单</Text>
                <Button
                  className="bg-blue-500"
                  onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/index' })}
                >
                  <Text>发布需求</Text>
                </Button>
              </View>
            ) : (
              <View className="space-y-3">
                {orders.map((order) => (
                  <View key={order.id} className="bg-gray-50 rounded-lg p-4">
                    <View className="flex justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="block font-medium text-base mb-1">
                          {order.demand?.cargo_name || '货物'}
                        </Text>
                        <View className="flex items-center gap-2 mb-2">
                          {order.demand && (
                            <Badge className={getCargoTypeColor(order.demand.cargo_type)}>
                              <Text className="text-white text-xs">
                                {getCargoTypeText(order.demand.cargo_type)}
                              </Text>
                            </Badge>
                          )}
                          <Badge className={getStatusColor(order.status)}>
                            <Text className="text-white text-xs">
                              {getStatusText(order.status)}
                            </Text>
                          </Badge>
                        </View>
                      </View>
                    </View>

                    {/* 需求信息 */}
                    {order.demand && (
                      <View className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">取货:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {order.demand.pickup_address}
                          </Text>
                        </View>
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">送货:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {order.demand.delivery_address}
                          </Text>
                        </View>
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">时间:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {new Date(order.demand.pickup_time).toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">规格:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {order.demand.weight}kg / {order.demand.volume}m³
                          </Text>
                        </View>
                        {order.demand.remarks && (
                          <View className="flex items-start">
                            <Text className="text-xs text-gray-500 w-16 flex-shrink-0">备注:</Text>
                            <Text className="text-xs text-gray-700 flex-1">
                              {order.demand.remarks}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* 车辆和车主信息（仅已接单后显示） */}
                    {(order.vehicle || order.owner) && (
                      <View className="space-y-2 mb-3 pb-3 border-b border-gray-200">
                        {order.vehicle && (
                          <View className="flex items-start">
                            <Text className="text-xs text-gray-500 w-16 flex-shrink-0">车辆:</Text>
                            <Text className="text-xs text-gray-700 flex-1">
                              {order.vehicle.brand} {order.vehicle.model}
                              {order.vehicle.plate_number && ` (${order.vehicle.plate_number})`}
                            </Text>
                          </View>
                        )}
                        {order.owner && (
                          <View className="flex items-start">
                            <Text className="text-xs text-gray-500 w-16 flex-shrink-0">车主:</Text>
                            <Text className="text-xs text-gray-700 flex-1">
                              {order.owner.name} ({order.owner.phone})
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* 运费信息（仅已接单后显示） */}
                    {order.status === 'accepted' && order.fare_price && (
                      <View className="bg-yellow-50 rounded-lg p-3 mb-3">
                        <View className="flex justify-between items-center">
                          <View>
                            <Text className="block text-xs text-gray-600 mb-1">运费报价</Text>
                            <Text className="block text-lg font-bold text-orange-600">
                              ¥{order.fare_price.toFixed(2)}
                            </Text>
                          </View>
                          {!order.merchant_confirmed && (
                            <Button
                              size="sm"
                              className="bg-orange-500"
                              onClick={() => handleConfirmFare(order.id)}
                            >
                              <Text className="text-xs">确认运费</Text>
                            </Button>
                          )}
                          {order.merchant_confirmed && (
                            <View className="bg-green-500 px-3 py-1 rounded-lg">
                              <Text className="text-xs text-white">已确认</Text>
                            </View>
                          )}
                        </View>
                        {order.confirm_time && (
                          <Text className="text-xs text-gray-500 mt-2 block">
                            确认时间: {new Date(order.confirm_time).toLocaleString()}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* 时间信息 */}
                    {order.accept_time && (
                      <Text className="text-xs text-gray-500 mb-1">
                        接单时间: {new Date(order.accept_time).toLocaleString()}
                      </Text>
                    )}
                    {order.complete_time && (
                      <Text className="text-xs text-gray-500 mb-1">
                        完成时间: {new Date(order.complete_time).toLocaleString()}
                      </Text>
                    )}
                    {order.cancel_reason && (
                      <View className="mt-2 pt-2 border-t border-gray-200">
                        <Text className="text-xs text-gray-500">
                          取消原因: {order.cancel_reason}
                        </Text>
                      </View>
                    )}

                    <Text className="text-xs text-gray-400 mt-2">
                      创建时间: {new Date(order.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
