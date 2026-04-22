import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Demand {
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
  created_at: string
}

export default function DemandsList() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'merchant') {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
      return
    }
    loadDemands()
  }, [])

  const loadDemands = async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    try {
      const res = await Network.request({
        url: '/api/demands',
        data: { merchant_id: userInfo.id }
      })

      console.log('需求列表响应:', res.data)

      if (res.data.code === 200) {
        setDemands(res.data.data)
      }
    } catch (error) {
      console.error('加载需求列表失败:', error)
    }
  }

  const handleCancelDemand = (demand: Demand) => {
    setSelectedDemand(demand)
    setShowCancelDialog(true)
    setCancelReason('')
  }

  const handleCloseCancelDialog = () => {
    setShowCancelDialog(false)
    setSelectedDemand(null)
    setCancelReason('')
  }

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      Taro.showToast({
        title: '请输入取消原因',
        icon: 'none'
      })
      return
    }

    if (!selectedDemand) return

    setLoading(true)

    try {
      const res = await Network.request({
        url: `/api/demands/${selectedDemand.id}/cancel?id=${selectedDemand.id}`,
        method: 'POST',
        data: { reason: cancelReason }
      })

      console.log('取消需求响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '需求已取消',
          icon: 'success'
        })

        setShowCancelDialog(false)
        setSelectedDemand(null)
        setCancelReason('')

        loadDemands()
      } else {
        Taro.showToast({
          title: res.data.message || '取消失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('取消需求失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getCargoTypeText = (type: string) => {
    switch (type) {
      case 'normal':
        return '普通'
      case 'fresh':
        return '生鲜'
      case 'fragile':
        return '易碎'
      default:
        return '未知'
    }
  }

  const getCargoTypeColor = (type: string) => {
    switch (type) {
      case 'normal':
        return 'bg-blue-500'
      case 'fresh':
        return 'bg-green-500'
      case 'fragile':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'accepted':
        return 'bg-blue-500'
      case 'in_transit':
        return 'bg-purple-500'
      case 'completed':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待接单'
      case 'accepted':
        return '已接单'
      case 'in_transit':
        return '运输中'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
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
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/publish' })}
            >
              <Text className="text-xs">发布需求</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/orders/index' })}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              我的需求
            </CardTitle>
            <Button
              size="sm"
              className="bg-blue-500"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/publish' })}
            >
              <Text>发布需求</Text>
            </Button>
          </CardHeader>
          <CardContent>
            {demands.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm mb-4">
                  您还没有发布需求
                </Text>
                <Button
                  className="bg-blue-500"
                  onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/publish' })}
                >
                  <Text>发布需求</Text>
                </Button>
              </View>
            ) : (
              <View className="space-y-3">
                {demands.map((demand) => (
                  <View key={demand.id} className="bg-gray-50 rounded-lg p-4">
                    <View className="flex justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="block font-medium text-base mb-1">
                          {demand.cargo_name}
                        </Text>
                        <View className="flex items-center gap-2 mb-2">
                          <Badge className={getCargoTypeColor(demand.cargo_type)}>
                            <Text className="text-white text-xs">
                              {getCargoTypeText(demand.cargo_type)}
                            </Text>
                          </Badge>
                          <Badge className={getStatusColor(demand.status)}>
                            <Text className="text-white text-xs">
                              {getStatusText(demand.status)}
                            </Text>
                          </Badge>
                        </View>
                      </View>
                      {demand.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-500"
                          onClick={() => handleCancelDemand(demand)}
                        >
                          <Text className="text-xs">取消</Text>
                        </Button>
                      )}
                    </View>
                    <View className="space-y-2 mb-3">
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">取货:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.pickup_address}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">送货:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.delivery_address}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">时间:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {new Date(demand.pickup_time).toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">规格:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.weight}kg / {demand.volume}m³
                        </Text>
                      </View>
                      {demand.remarks && (
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">备注:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {demand.remarks}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-gray-400">
                      发布时间: {new Date(demand.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 取消需求弹窗 */}
      {showCancelDialog && selectedDemand && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <View className="space-y-4">
              <View>
                <Text className="block text-base font-medium mb-2">
                  取消需求
                </Text>
                <Text className="block text-sm text-gray-600 mb-2">
                  确定要取消需求 &quot;{selectedDemand.cargo_name}&quot; 吗？
                </Text>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>取消原因
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Textarea
                    className="w-full"
                    placeholder="请输入取消原因"
                    value={cancelReason}
                    onInput={(e) => setCancelReason(e.detail.value)}
                    maxlength={200}
                  />
                </View>
              </View>

              <View className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-gray-200"
                  onClick={handleCloseCancelDialog}
                >
                  <Text>取消</Text>
                </Button>
                <Button
                  className="flex-1 bg-red-500"
                  onClick={handleConfirmCancel}
                  disabled={loading}
                >
                  <Text>{loading ? '处理中...' : '确认取消'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
