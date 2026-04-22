import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Statistics {
  orders: {
    total: number
    accepted: number
    in_transit: number
    completed: number
    cancelled: number
  }
  demands: {
    total: number
    completed: number
  }
}

export default function OwnerStats() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'owner') {
      Taro.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
      return
    }
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')

      // 查询订单统计数据
      const ordersRes = await Network.request({
        url: `/api/orders?owner_id=${userInfo.id}`,
        method: 'GET'
      })

      console.log('订单数据响应:', ordersRes.data)

      if (ordersRes.data.code === 200) {
        const orders = ordersRes.data.data || []

        const orderStats = {
          total: orders.length,
          accepted: orders.filter((o: any) => o.status === 'accepted').length,
          in_transit: orders.filter((o: any) => o.status === 'in_transit').length,
          completed: orders.filter((o: any) => o.status === 'completed').length,
          cancelled: orders.filter((o: any) => o.status === 'cancelled').length
        }

        // 查询需求数据（通过已接单的需求）
        const demandIds = orders.map((o: any) => o.demand_id).filter(Boolean)
        let completedDemands = 0

        if (demandIds.length > 0) {
          for (const demandId of demandIds) {
            try {
              const demandRes = await Network.request({
                url: `/api/demands/${demandId}?id=${demandId}`,
                method: 'GET'
              })
              if (demandRes.data.code === 200 && demandRes.data.data?.status === 'completed') {
                completedDemands++
              }
            } catch (error) {
              console.error('查询需求失败:', error)
            }
          }
        }

        const demandStats = {
          total: demandIds.length,
          completed: completedDemands
        }

        setStats({
          orders: orderStats,
          demands: demandStats
        })
      } else {
        Taro.showToast({
          title: ordersRes.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletionRate = () => {
    if (!stats || stats.demands.total === 0) return 0
    return Math.round((stats.demands.completed / stats.demands.total) * 100)
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
              onClick={() => Taro.navigateTo({ url: '/pages/owner/vehicles/index' })}
            >
              <Text className="text-xs">车辆管理</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/owner/demands/index' })}
            >
              <Text className="text-xs">接单大厅</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/owner/orders/index' })}
            >
              <Text className="text-xs">订单管理</Text>
            </Button>
            <Button
              size="sm"
              className="bg-blue-500"
            >
              <Text className="text-xs">收益统计</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/owner/profile/index' })}
            >
              <Text className="text-xs">我的</Text>
            </Button>
          </View>
        </View>
      </View>

      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                收益统计
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={loadStatistics}
                disabled={loading}
              >
                <Text className="text-xs">刷新</Text>
              </Button>
            </View>
          </CardHeader>
          <CardContent>
            {loading ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm">加载中...</Text>
              </View>
            ) : !stats ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm">暂无数据</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {/* 订单统计 */}
                <Card className="bg-blue-50 rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      订单统计
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <View className="grid grid-cols-2 gap-4">
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-blue-600 mb-1">
                          {stats.orders.total}
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          总订单数
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-green-600 mb-1">
                          {stats.orders.completed}
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          已完成
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-orange-600 mb-1">
                          {stats.orders.accepted + stats.orders.in_transit}
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          进行中
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-red-600 mb-1">
                          {stats.orders.cancelled}
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          已取消
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>

                {/* 需求完成率 */}
                <Card className="bg-green-50 rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      服务质量
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <View className="grid grid-cols-2 gap-4">
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-green-600 mb-1">
                          {stats.demands.total}
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          服务需求数
                        </Text>
                      </View>
                      <View className="text-center">
                        <Text className="block text-2xl font-bold text-green-600 mb-1">
                          {calculateCompletionRate()}%
                        </Text>
                        <Text className="block text-sm text-gray-600">
                          完成率
                        </Text>
                      </View>
                    </View>
                    {stats.demands.completed > 0 && (
                      <View className="mt-4 pt-4 border-t border-green-200">
                        <Text className="text-sm text-green-600 text-center">
                          已完成 {stats.demands.completed} 个需求
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>

                {/* 提示信息 */}
                <Card className="bg-yellow-50 rounded-lg">
                  <CardContent className="p-4">
                    <Text className="text-xs text-yellow-700 text-center">
                      💡 提示：完成更多订单可以提升接单优先级
                    </Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
