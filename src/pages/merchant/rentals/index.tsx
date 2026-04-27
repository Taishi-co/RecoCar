import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Car, Phone, Mail, Calendar, DollarSign, Info } from 'lucide-react-taro'
import { Network } from '@/network'

interface VehicleOwner {
  id: string
  name: string
  phone: string
  avatar_url?: string
}

interface Vehicle {
  id: string
  license_plate: string
  vehicle_type: string
  load_capacity: number
  volume: number
  battery_life: number
  has_cold_chain: boolean
  photos: string[]
  owner: VehicleOwner
  is_available_for_rent: boolean
  rent_monthly_price: number
  rent_yearly_price: number
  rent_deposit: number
  contact_phone?: string
  contact_wechat?: string
}

export default function VehicleRentals() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    loadVehicles()
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/rentals/available-vehicles'
      })

      console.log('可租赁车辆响应:', res.data)

      if (res.data.code === 200) {
        setVehicles(res.data.data || [])
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载可租赁车辆失败:', error)
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContactOwner = (vehicle: Vehicle) => {
    const phone = vehicle.contact_phone || vehicle.owner.phone
    const wechat = vehicle.contact_wechat

    if (wechat) {
      Taro.showModal({
        title: '联系车主',
        content: `电话：${phone}\n微信：${wechat}\n\n请通过电话或微信联系车主，商谈租赁细节。`,
        showCancel: false
      })
    } else {
      Taro.showModal({
        title: '联系车主',
        content: `电话：${phone}\n\n请通过电话联系车主，商谈租赁细节。`,
        showCancel: false
      })
    }
  }

  const handleViewDetail = (vehicle: Vehicle) => {
    Taro.navigateTo({
      url: `/pages/merchant/rentals/detail?vehicleId=${vehicle.id}`
    })
  }

  const getVehicleTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'small_truck': '小货车',
      'medium_truck': '中型货车',
      'large_truck': '大型货车',
      'van': '面包车',
      'pickup': '皮卡'
    }
    return typeMap[type] || type
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-4">
      {/* 头部 */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900 block">租车大厅</Text>
        <Text className="block text-sm text-gray-500 mt-1">浏览可租赁车辆，联系车主</Text>
      </View>

      {/* 提示信息 */}
      <View className="mx-4 mt-4 p-3 bg-blue-50 rounded-lg">
        <View className="flex items-start">
          <Info size={16} color="#1890ff" className="mr-2 flex-shrink-0 mt-1" />
          <Text className="block text-sm text-blue-700">
            平台只提供信息撮合服务。租金、押金、合同等交易均在线下完成。
          </Text>
        </View>
      </View>

      {/* 车辆列表 */}
      <View className="mx-4 mt-4 space-y-4">
        {loading ? (
          <View className="text-center py-8">
            <Text className="block text-gray-500">加载中...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View className="text-center py-8">
            <Text className="block text-gray-500">暂无可租赁车辆</Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <View className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {getVehicleTypeLabel(vehicle.vehicle_type)}（{vehicle.license_plate}）
                  </CardTitle>
                  {vehicle.has_cold_chain && (
                    <Badge className="bg-blue-500">冷链</Badge>
                  )}
                </View>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 车辆基本信息 */}
                <View className="space-y-2">
                  <View className="flex items-center text-sm text-gray-600">
                    <Car size={14} className="mr-2" color="#6b7280" />
                    <Text className="block">载重：{vehicle.load_capacity}kg</Text>
                  </View>
                  <View className="flex items-center text-sm text-gray-600">
                    <Car size={14} className="mr-2" color="#6b7280" />
                    <Text className="block">容积：{vehicle.volume}m³</Text>
                  </View>
                  <View className="flex items-center text-sm text-gray-600">
                    <Car size={14} className="mr-2" color="#6b7280" />
                    <Text className="block">续航：{vehicle.battery_life}km</Text>
                  </View>
                </View>

                <Separator />

                {/* 租赁信息 */}
                <View className="bg-gray-50 p-3 rounded-lg">
                  <View className="flex items-center text-sm text-gray-700 mb-2">
                    <Calendar size={14} className="mr-2" color="#6b7280" />
                    <Text className="block font-medium">租赁价格</Text>
                  </View>
                  <View className="flex items-baseline text-sm text-gray-600">
                    <Text className="block mr-4">月租：¥{vehicle.rent_monthly_price}/月</Text>
                    <Text className="block">年租：¥{vehicle.rent_yearly_price}/年</Text>
                  </View>
                  <View className="flex items-center text-sm text-gray-600 mt-1">
                    <DollarSign size={14} className="mr-2" color="#6b7280" />
                    <Text className="block">押金：¥{vehicle.rent_deposit}</Text>
                  </View>
                </View>

                <Separator />

                {/* 车主信息 */}
                <View>
                  <Text className="block text-sm font-medium text-gray-700 mb-2">车主信息</Text>
                  <View className="space-y-2">
                    <View className="flex items-center text-sm text-gray-600">
                      <Text className="block">{vehicle.owner.name}</Text>
                    </View>
                    {vehicle.contact_wechat && (
                      <View className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-2" color="#6b7280" />
                        <Text className="block">微信：{vehicle.contact_wechat}</Text>
                      </View>
                    )}
                    <View className="flex items-center text-sm text-gray-600">
                      <Phone size={14} className="mr-2" color="#6b7280" />
                      <Text className="block">电话：{vehicle.contact_phone || vehicle.owner.phone}</Text>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleViewDetail(vehicle)}
                  >
                    查看详情
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleContactOwner(vehicle)}
                  >
                    联系车主
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  )
}
