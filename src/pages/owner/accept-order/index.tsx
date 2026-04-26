import { useEffect, useState } from 'react'
import { View, Text, Map, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Vehicle {
  id: string
  vehicle_type: string
  license_plate?: string
  load_capacity: number
  volume: number
  battery_life: number
  has_cold_chain: boolean
  status: string
  is_available: boolean
  trip_status: string
  base_price?: number
  base_distance?: number
  price_per_km?: number
}

interface Demand {
  id: string
  cargo_name: string
  pickup_address: string
  pickup_lat?: string
  pickup_lng?: string
  delivery_address: string
  delivery_lat?: string
  delivery_lng?: string
  pickup_time: string
  weight: string
  volume: string
  cargo_description?: string
}

export default function AcceptOrder() {
  const [demandId, setDemandId] = useState<string>('')
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [acceptNote, setAcceptNote] = useState('')
  const [farePrice, setFarePrice] = useState('')
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null)
  const [fareCalculationDetail, setFareCalculationDetail] = useState<any>(null)
  const [routePolyline, setRoutePolyline] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.demandId) {
      setDemandId(params.demandId)
      loadDemandDetail(params.demandId)
      loadVehicles()
    }
  }, [])

  // 加载需求详情
  const loadDemandDetail = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/demands/${id}`
      })

      if (res.data.code === 200 && res.data.data) {
        setSelectedDemand(res.data.data)

        // 获取路线数据
        if (res.data.data.pickup_lat && res.data.data.pickup_lng &&
            res.data.data.delivery_lat && res.data.data.delivery_lng) {
          await fetchRouteData(res.data.data)
        }
      }
    } catch (error) {
      console.error('加载需求详情失败:', error)
      Taro.showToast({
        title: '加载需求失败',
        icon: 'none'
      })
    }
  }

  // 加载车主的车辆列表
  const loadVehicles = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: `/api/vehicles?owner_id=${userInfo.id}`
      })

      if (res.data.code === 200) {
        const vehicleList = res.data.data || []
        const availableVehicles = vehicleList.filter((v: Vehicle) =>
          v.status === 'active' && v.is_available === true && v.trip_status === 'idle'
        )
        setVehicles(availableVehicles)
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error)
    }
  }

  // 获取路线数据
  const fetchRouteData = async (demand: Demand) => {
    if (!demand.pickup_lat || !demand.pickup_lng ||
        !demand.delivery_lat || !demand.delivery_lng) {
      return
    }

    try {
      const res = await Network.request({
        url: '/api/demands/calculate-distance',
        method: 'POST',
        data: {
          pickup_address: demand.pickup_address,
          pickup_lat: parseFloat(demand.pickup_lat),
          pickup_lng: parseFloat(demand.pickup_lng),
          delivery_address: demand.delivery_address,
          delivery_lat: parseFloat(demand.delivery_lat),
          delivery_lng: parseFloat(demand.delivery_lng)
        }
      })

      console.log('路线数据响应:', res.data)

      if (res.data.code === 200 && res.data.data && res.data.data.polyline) {
        const points = res.data.data.polyline.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude
        }))
        setRoutePolyline(points)
      }
    } catch (error) {
      console.error('获取路线数据失败:', error)
    }
  }

  // 选择车辆
  const handleVehicleSelect = async (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)

    // 自动计算运费
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (!vehicle) return

      if (!selectedDemand || !selectedDemand.pickup_lat || !selectedDemand.pickup_lng ||
          !selectedDemand.delivery_lat || !selectedDemand.delivery_lng) {
        return
      }

      const res = await Network.request({
        url: '/api/fare/calculate',
        method: 'POST',
        data: {
          vehicle_id: vehicleId,
          total_distance: 0 // 将由服务端计算
        }
      })

      console.log('运费计算响应:', res.data)

      if (res.data.code === 200 && res.data.data) {
        // 先计算距离
        const distanceRes = await Network.request({
          url: '/api/demands/calculate-distance',
          method: 'POST',
          data: {
            pickup_address: selectedDemand.pickup_address,
            pickup_lat: parseFloat(selectedDemand.pickup_lat),
            pickup_lng: parseFloat(selectedDemand.pickup_lng),
            delivery_address: selectedDemand.delivery_address,
            delivery_lat: parseFloat(selectedDemand.delivery_lat),
            delivery_lng: parseFloat(selectedDemand.delivery_lng)
          }
        })

        if (distanceRes.data.code === 200) {
          const distance = distanceRes.data.data.distance

          const basePrice = vehicle.base_price || 20
          const baseDistance = vehicle.base_distance || 3
          const pricePerKm = vehicle.price_per_km || 2
          const extraDistance = Math.max(0, distance - baseDistance)
          const extraFare = extraDistance * pricePerKm
          const totalFare = basePrice + extraFare

          const fareData = {
            total_fare: totalFare,
            calculation_detail: {
              base_price: basePrice,
              base_distance: baseDistance,
              price_per_km: pricePerKm,
              total_distance: distance,
              extra_distance: extraDistance,
              extra_fare: extraFare,
              total_fare: totalFare
            }
          }

          setCalculatedFare(fareData.total_fare)
          setFareCalculationDetail(fareData.calculation_detail)
          setFarePrice(Math.floor(fareData.total_fare).toString())

          Taro.showToast({
            title: `已自动计算运费：¥${Math.floor(totalFare)}`,
            icon: 'success'
          })
        }
      }
    } catch (error) {
      console.error('计算运费失败:', error)
    }
  }

  // 确认接单
  const handleConfirmAccept = async () => {
    if (!selectedDemand || !demandId) {
      Taro.showToast({
        title: '需求信息不完整',
        icon: 'none'
      })
      return
    }

    if (!selectedVehicleId) {
      Taro.showToast({
        title: '请选择车辆',
        icon: 'none'
      })
      return
    }

    if (!farePrice || !parseFloat(farePrice)) {
      Taro.showToast({
        title: '请输入运费',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: '/api/accept-demand',
        method: 'POST',
        data: {
          demand_id: demandId,
          owner_id: userInfo.id,
          vehicle_id: selectedVehicleId,
          fare_price: parseFloat(farePrice),
          remarks: acceptNote
        }
      })

      console.log('接单响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '接单成功',
          icon: 'success',
          duration: 2000
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
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

  if (!selectedDemand) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部固定区域 */}
      <View className="bg-white px-4 py-3 flex-shrink-0 border-b border-gray-200">
        <View className="flex items-center justify-between mb-2">
          <Text className="text-lg font-semibold">确认接单</Text>
          <View
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            onClick={() => Taro.navigateBack()}
          >
            <Text className="text-gray-500">✕</Text>
          </View>
        </View>
        <Text className="text-sm text-gray-500">
          请确认接单：{selectedDemand.cargo_name}
        </Text>
      </View>

      {/* 可滚动内容区域 */}
      <ScrollView scrollY className="flex-1">
        <View className="p-4 space-y-4">
          {/* 需求信息 */}
          <View className="bg-white rounded-lg p-4">
            <Text className="font-medium mb-3 text-sm">需求信息</Text>
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
              {selectedDemand.cargo_description && (
                <View className="flex items-start">
                  <Text className="text-xs text-gray-500 w-16 flex-shrink-0">描述:</Text>
                  <Text className="text-xs text-gray-700 flex-1">
                    {selectedDemand.cargo_description}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 地图展示 */}
          {(selectedDemand.pickup_lat && selectedDemand.pickup_lng) && (
            <View className="bg-white rounded-lg p-4">
              <Text className="font-medium mb-3 text-sm">路线地图</Text>
              <View className="rounded-lg overflow-hidden bg-gray-100">
                {Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? (
                  <Map
                    id="accept-map"
                    className="w-full"
                    style={{ height: '200px' }}
                    latitude={parseFloat(selectedDemand.pickup_lat)}
                    longitude={parseFloat(selectedDemand.pickup_lng)}
                    scale={10}
                    showLocation
                    enableZoom
                    enableScroll
                    onError={(e) => console.log('地图加载失败:', e)}
                    markers={([
                      {
                        id: 1,
                        latitude: parseFloat(selectedDemand.pickup_lat),
                        longitude: parseFloat(selectedDemand.pickup_lng),
                        title: '取货点',
                        iconPath: '',
                        width: 24,
                        height: 24
                      },
                      ...(selectedDemand.delivery_lat && selectedDemand.delivery_lng ? [{
                        id: 2,
                        latitude: parseFloat(selectedDemand.delivery_lat),
                        longitude: parseFloat(selectedDemand.delivery_lng),
                        title: '送货点',
                        iconPath: '',
                        width: 24,
                        height: 24
                      }] : [])
                    ] as any)}
                    polyline={
                      routePolyline.length > 0
                        ? [
                            {
                              points: routePolyline,
                              color: '#3b82f6',
                              width: 4,
                              dottedLine: false
                            }
                          ]
                        : selectedDemand.delivery_lat && selectedDemand.delivery_lng
                          ? [
                              {
                                points: [
                                  {
                                    latitude: parseFloat(selectedDemand.pickup_lat),
                                    longitude: parseFloat(selectedDemand.pickup_lng)
                                  },
                                  {
                                    latitude: parseFloat(selectedDemand.delivery_lat),
                                    longitude: parseFloat(selectedDemand.delivery_lng)
                                  }
                                ],
                                color: '#3b82f6',
                                width: 4,
                                dottedLine: true
                              }
                            ]
                          : []
                    }
                  />
                ) : (
                  <View className="flex items-center justify-center h-48">
                    <Text className="text-sm text-gray-500 text-center">
                      地图功能仅在小程序中可用
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 车辆选择 */}
          <View className="bg-white rounded-lg p-4">
            <Text className="font-medium mb-3 text-sm">
              <Text className="text-red-500">*</Text>选择车辆
            </Text>
            {vehicles.length === 0 ? (
              <View className="bg-gray-50 rounded-lg p-4 text-center">
                <Text className="text-gray-500 text-sm mb-2">
                  暂无可用车辆
                </Text>
                <Text className="text-gray-400 text-xs">
                  请前往车辆管理页面设置车辆为出车状态
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {vehicles.map((vehicle) => (
                  <View
                    key={vehicle.id}
                    className={`bg-gray-50 rounded-lg p-4 ${
                      selectedVehicleId === vehicle.id ? 'border-2 border-blue-500' : 'border-2 border-transparent'
                    }`}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                  >
                    <View className="flex items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium text-sm mb-2">
                          {vehicle.vehicle_type}
                        </Text>
                        <View className="flex items-center gap-2 mb-2">
                          <Text className="text-xs text-gray-600">
                            车牌: {vehicle.license_plate || '未填写'}
                          </Text>
                          {vehicle.has_cold_chain && (
                            <Badge className="bg-cyan-500">
                              <Text className="text-white text-xs">冷链</Text>
                            </Badge>
                          )}
                        </View>
                        <Text className="text-xs text-gray-500 mb-2">
                          载重: {vehicle.load_capacity}kg | 容积: {vehicle.volume}m³ | 续航: {vehicle.battery_life}km
                        </Text>
                        {(vehicle.base_price || vehicle.base_distance || vehicle.price_per_km) && (
                          <Text className="text-xs text-blue-600 font-medium">
                            💰 起步¥{vehicle.base_price || 20}（{vehicle.base_distance || 3}公里）+ ¥{vehicle.price_per_km || 2}/公里
                          </Text>
                        )}
                      </View>
                      <View className="flex-shrink-0">
                        <View
                          style={{
                            width: '24px',
                            height: '24px',
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
          <View className="bg-white rounded-lg p-4">
            <Text className="font-medium mb-3 text-sm">
              <Text className="text-red-500">*</Text>运费设置
            </Text>

            {calculatedFare && fareCalculationDetail && (
              <View className="bg-green-50 rounded-lg p-4 mb-3">
                <Text className="text-sm font-medium text-green-700 mb-2">
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
                    • 总运费：¥{Math.floor(fareCalculationDetail.total_fare)}
                  </Text>
                </View>
              </View>
            )}

            <View className="bg-gray-50 rounded-lg px-4 py-3 mb-2">
              <View className="flex items-center">
                <View className="flex-1">
                  <Input
                    className="w-full bg-transparent"
                    placeholder={calculatedFare ? `系统计算: ¥${Math.floor(calculatedFare)}` : '请输入运费价格'}
                    type="digit"
                    value={farePrice}
                    onInput={(e) => setFarePrice(e.detail.value)}
                  />
                </View>
                <Text className="text-sm text-gray-600 ml-2">元</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-400">
              {calculatedFare ? '提示：可修改系统计算的运费' : '提示：选择车辆后系统将自动计算运费'}
            </Text>
          </View>

          {/* 备注说明 */}
          <View className="bg-white rounded-lg p-4">
            <Text className="font-medium mb-3 text-sm">
              备注说明（可选）
            </Text>
            <View className="bg-gray-50 rounded-lg p-4">
              <Textarea
                style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                placeholder="如：预计10分钟内到达取货点"
                maxlength={200}
                value={acceptNote}
                onInput={(e) => setAcceptNote(e.detail.value)}
              />
            </View>
            <Text className="text-xs text-gray-400 mt-2 text-right">
              {acceptNote.length}/200
            </Text>
          </View>
        </View>

        {/* 底部占位，防止内容被按钮遮挡 */}
        <View className="h-20" />
      </ScrollView>

      {/* 底部固定按钮区域 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
        <Button
          className="flex-1 bg-gray-200 h-12"
          onClick={() => Taro.navigateBack()}
          disabled={loading}
        >
          <Text>取消</Text>
        </Button>
        <Button
          className="flex-1 bg-blue-500 h-12"
          onClick={handleConfirmAccept}
          disabled={loading}
        >
          <Text>{loading ? '接单中...' : '确认接单'}</Text>
        </Button>
      </View>
    </View>
  )
}
