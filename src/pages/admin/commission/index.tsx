import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface PendingCommissionOrder {
  id: string
  fare_price: number
  commission_amount: number
  commission_payment_time: string
  vehicle?: {
    brand: string
    model: string
    plate_number: string
  }
  owner?: {
    name: string
    phone: string
  }
  demand?: {
    cargo_name: string
    pickup_address: string
    delivery_address: string
  }
}

export default function AdminCommission() {
  const [orders, setOrders] = useState<PendingCommissionOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'admin') {
      Taro.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
      return
    }
    loadPendingCommissionOrders()
  }, [])

  const loadPendingCommissionOrders = async () => {
    setLoading(true)

    try {
      const res = await Network.request({
        url: '/api/orders',
        method: 'GET',
        data: {
          status: 'commission_pending'
        }
      })

      console.log('待审核佣金订单响应:', res.data)

      if (res.data.code === 200) {
        setOrders(res.data.data || [])
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载待审核佣金订单失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCommission = async (orderId: string) => {
    Taro.showModal({
      title: '确认收到佣金',
      content: '确认已收到该订单的佣金支付？确认后将自动恢复车辆状态，车辆可以继续接单。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await Network.request({
              url: `/api/orders/${orderId}/commission-confirm`,
              method: 'PUT'
            })

            console.log('确认佣金响应:', response.data)

            if (response.data.code === 200) {
              Taro.showToast({
                title: '佣金已确认，订单完成',
                icon: 'success'
              })

              loadPendingCommissionOrders()
            } else {
              Taro.showToast({
                title: response.data.message || '操作失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('确认佣金失败:', error)
            Taro.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <View className="bg-purple-500 pt-12 pb-6 px-4">
        <Text className="block text-xl font-bold text-white">
          佣金审核
        </Text>
        <Text className="block text-sm text-purple-100 mt-1">
          待审核的佣金支付
        </Text>
      </View>

      {/* 内容区域 */}
      <View className="px-4 -mt-4">
        {loading ? (
          <View className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Text className="text-gray-500">暂无待审核佣金</Text>
          </View>
        ) : (
          <View className="space-y-3 pb-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white rounded-lg shadow-sm">
                <CardHeader>
                  <View className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      订单 #{order.id.slice(-6)}
                    </CardTitle>
                    <Badge className="bg-pink-500">
                      <Text className="text-white text-xs">
                        待审核
                      </Text>
                    </Badge>
                  </View>
                </CardHeader>
                <CardContent>
                  {/* 货物信息 */}
                  {order.demand && (
                    <View className="mb-3 pb-3 border-b border-gray-200">
                      <View className="flex items-center mb-1">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">
                          货物：
                        </Text>
                        <Text className="text-xs text-gray-800 flex-1">
                          {order.demand.cargo_name}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">
                          路线：
                        </Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {order.demand.pickup_address}
                          {' → '}
                          {order.demand.delivery_address}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 车辆信息 */}
                  {order.vehicle && (
                    <View className="mb-3 pb-3 border-b border-gray-200">
                      <View className="flex items-center">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">
                          车辆：
                        </Text>
                        <Text className="text-xs text-gray-800 flex-1">
                          {order.vehicle.brand} {order.vehicle.model}
                          {' · '}
                          {order.vehicle.plate_number}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 运力方信息 */}
                  {order.owner && (
                    <View className="mb-3 pb-3 border-b border-gray-200">
                      <View className="flex items-center">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">
                          运力方：
                        </Text>
                        <Text className="text-xs text-gray-800 flex-1">
                          {order.owner.name} ({order.owner.phone})
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 金额信息 */}
                  <View className="mb-4">
                    <View className="flex justify-between items-center mb-1">
                      <Text className="text-sm text-gray-600">运费金额</Text>
                      <Text className="text-sm font-semibold">
                        ¥{order.fare_price || 0}
                      </Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-gray-600">佣金金额</Text>
                      <Text className="text-lg font-bold text-red-500">
                        ¥{order.commission_amount || 0}
                      </Text>
                    </View>
                  </View>

                  {/* 提交时间 */}
                  {order.commission_payment_time && (
                    <View className="mb-4">
                      <Text className="text-xs text-gray-500 block">
                        提交时间：{new Date(order.commission_payment_time).toLocaleString('zh-CN')}
                      </Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500"
                      onClick={() => handleConfirmCommission(order.id)}
                    >
                      <Text className="text-xs">确认收到佣金</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
