import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useNotificationPolling } from '@/hooks/useNotificationPolling'

interface Vehicle {
  id: string
  vehicle_type: string
  license_plate: string
  load_capacity: number
  volume: number
  battery_life: number
  has_cold_chain: boolean
  status: string
  is_available: boolean
  trip_status: string
  // 定价字段
  base_price?: number
  base_distance?: number
  price_per_km?: number
}

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
  merchant_id: string
  // 距离相关字段
  estimated_distance?: number | string
  pickup_lat?: number | string
  pickup_lng?: number | string
  delivery_lat?: number | string
  delivery_lng?: number | string
  merchant?: {
    phone: string
    name: string
  }
}

export default function OwnerDemands() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [acceptNote, setAcceptNote] = useState('')
  const [farePrice, setFarePrice] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  // 运费计算相关状态
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null)
  const [fareCalculationDetail, setFareCalculationDetail] = useState<any>(null)

  // 启用通知轮询
  useNotificationPolling(30000) // 每30秒检查一次新通知

  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    setLoading(true)

    try {
      const res = await Network.request({
        url: '/api/demands?status=pending',
        method: 'GET'
      })

      console.log('需求列表响应:', res.data)

      if (res.data.code === 200) {
        setDemands(res.data.data || [])
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载需求列表失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
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

  const handleAcceptDemand = async (demand: Demand) => {
    setSelectedDemand(demand)
    setShowAcceptDialog(true)
    setAcceptNote('')
    setFarePrice('')
    setSelectedVehicleId('')
    setCalculatedFare(null)
    setFareCalculationDetail(null)

    // 获取当前车主信息
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'owner') {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setShowAcceptDialog(false)
      setSelectedDemand(null)
      return
    }

    // 加载车主的可用车辆
    try {
      const res = await Network.request({
        url: '/api/vehicles',
        method: 'GET',
        data: { owner_id: userInfo.id }
      })

      console.log('车辆列表响应:', res.data)

      if (res.data.code === 200) {
        const vehicleList = res.data.data || []
        // 只显示状态为 active、is_available 为 true 且 trip_status 为 idle 的车辆
        const availableVehicles = vehicleList.filter((v: Vehicle) =>
          v.status === 'active' && v.is_available === true && v.trip_status === 'idle'
        )
        setVehicles(availableVehicles)
      } else {
        Taro.showToast({
          title: res.data.message || '加载车辆列表失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }
  }

  const handleCloseAcceptDialog = () => {
    setShowAcceptDialog(false)
    setSelectedDemand(null)
    setAcceptNote('')
    setSelectedVehicleId('')
    setFarePrice('')
    setCalculatedFare(null)
    setFareCalculationDetail(null)
  }

  const handleVehicleSelect = async (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setFarePrice('')
    setCalculatedFare(null)
    setFareCalculationDetail(null)

    if (!selectedDemand || !vehicleId) return

    // 获取运输距离
    let totalDistance = 0
    if (selectedDemand.estimated_distance) {
      totalDistance = parseFloat(selectedDemand.estimated_distance as any)
    } else if (selectedDemand.pickup_lat && selectedDemand.pickup_lng &&
               selectedDemand.delivery_lat && selectedDemand.delivery_lng) {
      // 计算直线距离（Haversine公式）
      const R = 6371
      const dLat = (parseFloat(selectedDemand.delivery_lat as any) - parseFloat(selectedDemand.pickup_lat as any)) * Math.PI / 180
      const dLon = (parseFloat(selectedDemand.delivery_lng as any) - parseFloat(selectedDemand.pickup_lng as any)) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(parseFloat(selectedDemand.pickup_lat as any) * Math.PI / 180) *
                Math.cos(parseFloat(selectedDemand.delivery_lat as any) * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      totalDistance = R * c
    }

    if (totalDistance <= 0) {
      Taro.showToast({
        title: '无法计算距离',
        icon: 'none'
      })
      return
    }

    // 调用运费计算API
    try {
      const res = await Network.request({
        url: '/api/fare/calculate',
        method: 'POST',
        data: {
          vehicle_id: vehicleId,
          total_distance: totalDistance
        }
      })

      console.log('运费计算响应:', res.data)

      if (res.data.code === 200 && res.data.data) {
        const fareData = res.data.data
        setCalculatedFare(fareData.total_fare)
        setFareCalculationDetail(fareData.calculation_detail)
        setFarePrice(fareData.total_fare.toString())

        Taro.showToast({
          title: `已自动计算运费：¥${fareData.total_fare.toFixed(2)}`,
          icon: 'success'
        })
      } else {
        Taro.showToast({
          title: '运费计算失败，请手动输入',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('运费计算失败:', error)
      Taro.showToast({
        title: '运费计算失败，请手动输入',
        icon: 'none'
      })
    }
  }

  const handleConfirmAccept = async () => {
    if (!selectedDemand) return

    // 验证是否选择了车辆
    if (!selectedVehicleId) {
      Taro.showToast({
        title: '请选择一辆车',
        icon: 'none'
      })
      return
    }

    // 验证是否设置了运费
    if (!farePrice || parseFloat(farePrice) <= 0) {
      Taro.showToast({
        title: '请设置运费',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      // 获取当前车主信息
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo || userInfo.role !== 'owner') {
        setLoading(false)
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      const res = await Network.request({
        url: `/api/demands/${selectedDemand.id}/accept`,
        method: 'POST',
        data: {
          ownerId: userInfo.id,
          vehicleId: selectedVehicleId,
          farePrice: parseFloat(farePrice),
          note: acceptNote
        }
      })

      console.log('接单响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '接单成功，等待需求方确认运费',
          icon: 'success'
        })

        setShowAcceptDialog(false)
        setSelectedDemand(null)
        setAcceptNote('')
        setFarePrice('')
        setSelectedVehicleId('')

        // 重新加载需求列表
        loadDemands()
      } else {
        Taro.showToast({
          title: res.data.message || '接单失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('接单失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDemands()
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 导航菜单 */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-3">
          <View className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-500"
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
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/owner/vehicles/index' })}
            >
              <Text className="text-xs">车辆管理</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/owner/stats/index' })}
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
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                待接单需求
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
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
            ) : demands.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm mb-4">
                  暂无待接单需求
                </Text>
                <Button
                  className="bg-blue-500"
                  onClick={handleRefresh}
                >
                  <Text>刷新</Text>
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
                          <Badge className="bg-green-500">
                            <Text className="text-white text-xs">
                              待接单
                            </Text>
                          </Badge>
                        </View>
                      </View>
                      <Button
                        size="sm"
                        className="bg-blue-500"
                        onClick={() => handleAcceptDemand(demand)}
                      >
                        <Text className="text-xs">接单</Text>
                      </Button>
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

      {/* 接单确认弹窗 */}
      {showAcceptDialog && selectedDemand && (
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent className="sm:max-w-md">
            <View className="p-6">
              <Text className="block text-lg font-semibold mb-2">
                确认接单
              </Text>
              <Text className="block text-sm text-gray-500 mb-4">
                请确认接单：{selectedDemand.cargo_name}
              </Text>
              <View className="bg-gray-50 rounded-lg p-4 mb-4">
                <View className="space-y-2">
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">取货:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.pickup_address}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">送货:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.delivery_address}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">时间:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {new Date(selectedDemand.pickup_time).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">规格:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.weight}kg / {selectedDemand.volume}m³
                    </Text>
                  </View>
                </View>
              </View>

              {/* 车辆选择 */}
              <View className="mb-4">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>选择车辆
                </Label>
                {vehicles.length === 0 ? (
                  <View className="bg-gray-50 rounded-lg p-4 text-center">
                    <Text className="block text-gray-500 text-sm mb-2">
                      暂无可用车辆
                    </Text>
                    <Text className="block text-gray-400 text-xs">
                      请前往车辆管理页面设置车辆为出车状态
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {vehicles.map((vehicle) => (
                      <View
                        key={vehicle.id}
                        className={`bg-gray-50 rounded-lg p-3 ${
                          selectedVehicleId === vehicle.id ? 'border-2 border-blue-500' : 'border-2 border-transparent'
                        }`}
                        onClick={() => handleVehicleSelect(vehicle.id)}
                      >
                        <View className="flex items-center justify-between">
                          <View className="flex-1">
                            <Text className="block font-medium text-sm mb-1">
                              {vehicle.vehicle_type}
                            </Text>
                            <View className="flex items-center gap-2 mb-1">
                              <Text className="text-xs text-gray-600">
                                车牌: {vehicle.license_plate || '未填写'}
                              </Text>
                              {vehicle.has_cold_chain && (
                                <Badge className="bg-cyan-500">
                                  <Text className="text-white text-xs">冷链</Text>
                                </Badge>
                              )}
                            </View>
                            <Text className="text-xs text-gray-500">
                              载重: {vehicle.load_capacity}kg | 容积: {vehicle.volume}m³ | 续航: {vehicle.battery_life}km
                            </Text>
                            {/* 定价信息 */}
                            {(vehicle.base_price || vehicle.base_distance || vehicle.price_per_km) && (
                              <Text className="text-xs text-blue-600 font-medium mt-1">
                                💰 起步¥{vehicle.base_price || 20}（{vehicle.base_distance || 3}公里）+ ¥{vehicle.price_per_km || 2}/公里
                              </Text>
                            )}
                          </View>
                          <View className="flex-shrink-0">
                            <View
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: '2px solid #d1d5db',
                                backgroundColor: selectedVehicleId === vehicle.id ? '#3b82f6' : 'transparent',
                                borderWidth: selectedVehicleId === vehicle.id ? '6px' : '2px'
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 运费设置 */}
              <View className="mb-4">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>运费设置
                </Label>

                {/* 运费计算详情 */}
                {calculatedFare && fareCalculationDetail && (
                  <View className="bg-green-50 rounded-lg p-3 mb-3">
                    <Text className="block text-sm font-medium text-green-700 mb-2">
                      ✅ 系统自动计算运费
                    </Text>
                    <View className="space-y-1">
                      <Text className="text-xs text-green-600">
                        • 起步价：¥{fareCalculationDetail.base_price}（{fareCalculationDetail.base_distance}公里）
                      </Text>
                      <Text className="text-xs text-green-600">
                        • 总距离：{fareCalculationDetail.total_distance.toFixed(2)}公里
                      </Text>
                      <Text className="text-xs text-green-600">
                        • 额外距离：{fareCalculationDetail.extra_distance.toFixed(2)}公里
                      </Text>
                      <Text className="text-xs text-green-600">
                        • 额外费用：¥{fareCalculationDetail.extra_fare.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-green-700 font-bold">
                        • 总运费：¥{fareCalculationDetail.total_fare.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <View className="flex items-center">
                    <View className="flex-1">
                      <Input
                        className="w-full bg-transparent"
                        placeholder={calculatedFare ? `系统计算: ¥${calculatedFare.toFixed(2)}` : '请输入运费价格'}
                        type="digit"
                        value={farePrice}
                        onInput={(e) => setFarePrice(e.detail.value)}
                      />
                    </View>
                    <Text className="text-sm text-gray-600 ml-2">元</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-400 mt-1">
                  {calculatedFare ? '提示：可修改系统计算的运费（±10%以内）' : '提示：选择车辆后系统将自动计算运费'}
                </Text>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">
                  备注说明（可选）
                </Label>
                <View className="bg-gray-50 rounded-lg p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="如：预计10分钟内到达取货点"
                    maxlength={200}
                    value={acceptNote}
                    onInput={(e) => setAcceptNote(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex gap-3 mt-6">
                <Button
                  className="flex-1 bg-gray-200"
                  onClick={handleCloseAcceptDialog}
                  disabled={loading}
                >
                  <Text>取消</Text>
                </Button>
                <Button
                  className="flex-1 bg-blue-500"
                  onClick={handleConfirmAccept}
                  disabled={loading}
                >
                  <Text>{loading ? '接单中...' : '确认接单'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
