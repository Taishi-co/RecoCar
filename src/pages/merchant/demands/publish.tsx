import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Route, BookOpen, MapPin, Check } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface FormData {
  cargo_name: string
  cargo_type: string
  weight: string
  volume: string
  pickup_time: string
  pickup_address: string
  pickup_location: { latitude: number; longitude: number } | null
  delivery_address: string
  delivery_location: { latitude: number; longitude: number } | null
  remarks: string
  estimated_distance: number | null
  estimated_fare: number | null
  is_calculating: boolean
}

interface AddressBook {
  id: string
  user_id: string
  address_name: string
  address: string
  latitude: number
  longitude: number
  address_type: string
  is_default: boolean
}

interface FavoriteRoute {
  id: string
  user_id: string
  route_name: string
  pickup_address_id: string | null
  delivery_address_id: string | null
  estimated_distance: number | null
  estimated_fare: number | null
  use_count: number
  pickup_address?: AddressBook
  delivery_address?: AddressBook
}

export default function PublishDemand() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cargo_name: '',
    cargo_type: 'normal',
    weight: '',
    volume: '',
    pickup_time: '',
    pickup_address: '',
    pickup_location: null,
    delivery_address: '',
    delivery_location: null,
    remarks: '',
    estimated_distance: null,
    estimated_fare: null,
    is_calculating: false
  })

  // 地址簿和线路数据
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([])
  const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([])
  const [showAddressPicker, setShowAddressPicker] = useState<'pickup' | 'delivery' | undefined>(undefined)
  const [showRoutePicker, setShowRoutePicker] = useState(false)

  // 检查是否从常用线路跳转过来，自动填充地址信息
  useEffect(() => {
    try {
      const instance = Taro.getCurrentInstance()
      const routeParams = instance.router?.params

      if (routeParams?.route) {
        const routeData = JSON.parse(decodeURIComponent(routeParams.route))

        console.log('[PublishDemand] 从常用线路跳转:', routeData)

        // 自动填充取货地址和送货地址
        setFormData((prev) => ({
          ...prev,
          pickup_address: routeData.pickup_address?.address || '',
          pickup_location: routeData.pickup_address?.latitude && routeData.pickup_address?.longitude
            ? {
                latitude: routeData.pickup_address.latitude,
                longitude: routeData.pickup_address.longitude
              }
            : null,
          delivery_address: routeData.delivery_address?.address || '',
          delivery_location: routeData.delivery_address?.latitude && routeData.delivery_address?.longitude
            ? {
                latitude: routeData.delivery_address.latitude,
                longitude: routeData.delivery_address.longitude
              }
            : null,
          estimated_distance: routeData.estimated_distance || null,
          estimated_fare: routeData.estimated_fare || null
        }))

        // 显示提示信息
        Taro.showToast({
          title: `已自动填充: ${routeData.route_name}`,
          icon: 'success',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('[PublishDemand] 解析线路参数失败:', error)
    }
  }, [])

  // 加载地址簿和常用线路
  useEffect(() => {
    loadAddressData()
  }, [])

  const loadAddressData = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')

      if (!userInfo || !userInfo.id) {
        return
      }

      // 并行加载地址簿和常用线路
      const [addressRes, routeRes] = await Promise.all([
        Network.request({
          url: '/api/address-books',
          method: 'GET',
          data: { user_id: userInfo.id }
        }),
        Network.request({
          url: '/api/favorite-routes',
          method: 'GET',
          data: { user_id: userInfo.id }
        })
      ])

      if (addressRes.data.code === 200) {
        setAddressBooks(addressRes.data.data || [])
      }

      if (routeRes.data.code === 200) {
        setFavoriteRoutes(routeRes.data.data || [])
      }
    } catch (error) {
      console.error('[PublishDemand] 加载地址数据失败:', error)
    }
  }

  const handlePickupDateSelect = (e) => {
    const date = e.detail.value
    const currentDate = formData.pickup_time ? new Date(formData.pickup_time) : new Date()
    const time = currentDate.toTimeString().slice(0, 5)
    const newPickupTime = `${date} ${time}:00`
    setFormData({ ...formData, pickup_time: newPickupTime })
  }

  const handlePickupTimeSelect = (e) => {
    const time = e.detail.value
    const date = formData.pickup_time ? formData.pickup_time.split(' ')[0] : new Date().toISOString().slice(0, 10)
    const newPickupTime = `${date} ${time}:00`
    setFormData({ ...formData, pickup_time: newPickupTime })
  }

  // 选择地址簿地址
  const handleSelectAddress = (address: AddressBook) => {
    const newFormData = { ...formData }

    if (showAddressPicker === 'pickup') {
      newFormData.pickup_address = address.address
      newFormData.pickup_location = {
        latitude: address.latitude,
        longitude: address.longitude
      }
    } else {
      newFormData.delivery_address = address.address
      newFormData.delivery_location = {
        latitude: address.latitude,
        longitude: address.longitude
      }
    }

    setFormData(newFormData)
    setShowAddressPicker(undefined)

    // 如果两个位置都有，触发距离计算
    if (newFormData.pickup_location && newFormData.delivery_location) {
      calculateDistance(newFormData)
    }

    Taro.showToast({
      title: '地址选择成功',
      icon: 'success'
    })
  }

  // 选择常用线路
  const handleSelectRoute = (route: FavoriteRoute) => {
    const newFormData = { ...formData }

    if (route.pickup_address) {
      newFormData.pickup_address = route.pickup_address.address
      newFormData.pickup_location = {
        latitude: route.pickup_address.latitude,
        longitude: route.pickup_address.longitude
      }
    }

    if (route.delivery_address) {
      newFormData.delivery_address = route.delivery_address.address
      newFormData.delivery_location = {
        latitude: route.delivery_address.latitude,
        longitude: route.delivery_address.longitude
      }
    }

    newFormData.estimated_distance = route.estimated_distance
    newFormData.estimated_fare = route.estimated_fare

    setFormData(newFormData)
    setShowRoutePicker(false)

    // 增加使用次数
    incrementRouteUseCount(route.id)

    Taro.showToast({
      title: `已选择线路: ${route.route_name}`,
      icon: 'success'
    })
  }

  // 增加线路使用次数
  const incrementRouteUseCount = async (routeId: string) => {
    try {
      await Network.request({
        url: `/api/favorite-routes/${routeId}/increment-use-count`,
        method: 'POST'
      })
    } catch (error) {
      console.error('[PublishDemand] 增加线路使用次数失败:', error)
    }
  }

  // 计算距离和运费
  const calculateDistance = async (currentFormData: FormData) => {
    if (!currentFormData.pickup_location || !currentFormData.delivery_location) {
      return
    }

    try {
      setFormData({ ...currentFormData, is_calculating: true })

      const res = await Network.request({
        url: '/api/demands/calculate-distance',
        method: 'POST',
        data: {
          pickup_address: currentFormData.pickup_address,
          pickup_lat: currentFormData.pickup_location.latitude,
          pickup_lng: currentFormData.pickup_location.longitude,
          delivery_address: currentFormData.delivery_address,
          delivery_lat: currentFormData.delivery_location.latitude,
          delivery_lng: currentFormData.delivery_location.longitude
        }
      })

      console.log('距离计算响应:', res.data)

      if (res.data.code === 200) {
        setFormData({
          ...currentFormData,
          estimated_distance: res.data.data.distance,
          estimated_fare: res.data.data.estimated_fare,
          is_calculating: false
        })
      } else {
        setFormData({ ...currentFormData, is_calculating: false })
        Taro.showToast({
          title: res.data.message || '距离计算失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('距离计算失败:', error)
      setFormData({ ...currentFormData, is_calculating: false })
      // 距离计算失败不影响继续发布
    }
  }

  const handleSubmit = async () => {
    if (!formData.cargo_name || !formData.weight || !formData.volume ||
        !formData.pickup_time || !formData.pickup_address || !formData.delivery_address) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!formData.pickup_location) {
      Taro.showToast({
        title: '请选择取货位置',
        icon: 'none'
      })
      return
    }

    if (!formData.delivery_location) {
      Taro.showToast({
        title: '请选择送货位置',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: '/api/demands',
        method: 'POST',
        data: {
          merchant_id: userInfo.id,
          cargo_name: formData.cargo_name,
          cargo_type: formData.cargo_type,
          weight: formData.weight,
          volume: formData.volume,
          pickup_time: formData.pickup_time,
          pickup_address: formData.pickup_address,
          pickup_location: JSON.stringify(formData.pickup_location),
          delivery_address: formData.delivery_address,
          delivery_location: JSON.stringify(formData.delivery_location),
          remarks: formData.remarks,
          pickup_lat: formData.pickup_location.latitude,
          pickup_lng: formData.pickup_location.longitude,
          delivery_lat: formData.delivery_location.latitude,
          delivery_lng: formData.delivery_location.longitude,
          estimated_distance: formData.estimated_distance,
          estimated_fare: formData.estimated_fare
        }
      })

      console.log('创建需求响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '需求发布成功',
          icon: 'success'
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({
          title: res.data.message || '发布失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('发布需求失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
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
              className="bg-blue-500"
            >
              <Text className="text-xs">发布需求</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/list' })}
            >
              <Text className="text-xs">我的需求</Text>
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
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/address-books/index' })}
            >
              <BookOpen size={16} color="#6b7280" />
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

      <Card className="bg-white rounded-lg shadow-sm m-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            发布需求
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="space-y-4">
            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>货品名称
              </Label>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：新鲜蔬菜"
                  value={formData.cargo_name}
                  onInput={(e) => setFormData({ ...formData, cargo_name: e.detail.value })}
                />
              </View>
            </View>

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>货品类型
              </Label>
              <View className="flex gap-3">
                {[
                  { value: 'normal', label: '普通' },
                  { value: 'fresh', label: '生鲜' },
                  { value: 'fragile', label: '易碎' }
                ].map((type) => (
                  <View
                    key={type.value}
                    onClick={() => setFormData({ ...formData, cargo_type: type.value })}
                  >
                    <View className={`px-4 py-2 rounded-lg border ${
                      formData.cargo_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    >
                      <Text className={`text-sm ${
                        formData.cargo_type === type.value
                          ? 'text-blue-500 font-medium'
                          : 'text-gray-700'
                      }`}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="flex gap-3">
              <View className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>重量（公斤）
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：30"
                    type="number"
                    value={formData.weight}
                    onInput={(e) => setFormData({ ...formData, weight: e.detail.value })}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>体积（立方米）
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：0.3"
                    type="digit"
                    value={formData.volume}
                    onInput={(e) => setFormData({ ...formData, volume: e.detail.value })}
                  />
                </View>
              </View>
            </View>

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>取货时间
              </Label>
              <View className="flex gap-3">
                <Picker
                  mode="date"
                  value={formData.pickup_time ? formData.pickup_time.split(' ')[0] : ''}
                  onChange={handlePickupDateSelect}
                >
                  <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <Text className={`text-sm ${formData.pickup_time ? 'text-gray-900' : 'text-gray-400'}`}>
                      {formData.pickup_time ? formData.pickup_time.split(' ')[0] : '选择日期'}
                    </Text>
                    <Text className="text-gray-400">📅</Text>
                  </View>
                </Picker>
                <Picker
                  mode="time"
                  value={formData.pickup_time ? formData.pickup_time.split(' ')[1].slice(0, 5) : ''}
                  onChange={handlePickupTimeSelect}
                >
                  <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <Text className={`text-sm ${formData.pickup_time ? 'text-gray-900' : 'text-gray-400'}`}>
                      {formData.pickup_time ? formData.pickup_time.split(' ')[1].slice(0, 5) : '选择时间'}
                    </Text>
                    <Text className="text-gray-400">⏰</Text>
                  </View>
                </Picker>
              </View>
            </View>

            {/* 快捷选择区域 */}
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="block text-sm font-medium text-blue-900 mb-2">快捷选择</Text>
              <Button
                size="sm"
                className="w-full bg-blue-500"
                onClick={() => setShowRoutePicker(true)}
                disabled={favoriteRoutes.length === 0}
              >
                <Route size={14} color="#fff" />
                <Text className="text-xs ml-1">常用线路</Text>
              </Button>
            </View>

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>取货地址
              </Label>
              <View className="flex gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请选择取货地址"
                    value={formData.pickup_address}
                    disabled
                  />
                </View>
                <Button
                  size="sm"
                  className="bg-blue-500 px-4"
                  onClick={() => setShowAddressPicker('pickup')}
                  disabled={addressBooks.length === 0}
                >
                  <MapPin size={14} color="#fff" />
                  <Text className="text-xs ml-1">选择</Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => Taro.navigateTo({ url: '/pages/merchant/address-books/index' })}
                >
                  <BookOpen size={14} color="#6b7280" />
                </Button>
              </View>

              {formData.pickup_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择：{formData.pickup_location.latitude.toFixed(6)}, {formData.pickup_location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>送货地址
              </Label>
              <View className="flex gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请选择送货地址"
                    value={formData.delivery_address}
                    disabled
                  />
                </View>
                <Button
                  size="sm"
                  className="bg-blue-500 px-4"
                  onClick={() => setShowAddressPicker('delivery')}
                  disabled={addressBooks.length === 0}
                >
                  <MapPin size={14} color="#fff" />
                  <Text className="text-xs ml-1">选择</Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => Taro.navigateTo({ url: '/pages/merchant/address-books/index' })}
                >
                  <BookOpen size={14} color="#6b7280" />
                </Button>
              </View>

              {formData.delivery_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择：{formData.delivery_location.latitude.toFixed(6)}, {formData.delivery_location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            {formData.estimated_distance && (
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="block text-sm font-medium text-green-900 mb-2">
                  距离估算：{formData.estimated_distance.toFixed(2)} 公里
                </Text>
                {formData.estimated_fare && (
                  <Text className="block text-sm text-green-700">
                    预估运费：¥{formData.estimated_fare.toFixed(2)}
                  </Text>
                )}
              </View>
            )}

            <View>
              <Label className="block text-sm font-medium mb-2">
                备注（选填）
              </Label>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：请提前10分钟联系"
                  value={formData.remarks}
                  onInput={(e) => setFormData({ ...formData, remarks: e.detail.value })}
                />
              </View>
            </View>

            <Button
              className="w-full bg-blue-500"
              onClick={handleSubmit}
              disabled={loading || formData.is_calculating}
            >
              <Text className="text-white font-medium">
                {formData.is_calculating ? '计算距离中...' : loading ? '发布中...' : '发布需求'}
              </Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* 地址簿选择弹窗 */}
      <Dialog open={showAddressPicker !== undefined} onOpenChange={(open) => !open && setShowAddressPicker(undefined)}>
        <DialogContent className="max-h-[60vh]">
          <DialogHeader>
            <DialogTitle>
              {showAddressPicker === 'pickup' ? '选择取货地址' : '选择送货地址'}
            </DialogTitle>
          </DialogHeader>
          <View className="space-y-2">
            {addressBooks.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-400 text-sm">暂无地址，请先添加地址</Text>
              </View>
            ) : (
              addressBooks.map((address) => (
                <View
                  key={address.id}
                  className="bg-gray-50 rounded-lg p-3"
                  onClick={() => handleSelectAddress(address)}
                >
                  <View className="flex items-start gap-2">
                    <MapPin size={16} color="#6b7280" />
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-900 mb-1">
                        {address.address_name}
                      </Text>
                      <Text className="block text-xs text-gray-600">
                        {address.address}
                      </Text>
                      {address.is_default && (
                        <View className="inline-block mt-1">
                          <Text className="text-xs text-blue-500">默认</Text>
                        </View>
                      )}
                    </View>
                    <Check size={16} color="#1890ff" />
                  </View>
                </View>
              ))
            )}
          </View>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddressPicker(undefined)}
            >
              <Text className="text-xs">取消</Text>
            </Button>
            <Button
              onClick={() => {
                setShowAddressPicker(undefined)
                Taro.navigateTo({ url: '/pages/merchant/address-books/index' })
              }}
            >
              <Text className="text-xs">添加地址</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 常用线路选择弹窗 */}
      <Dialog open={showRoutePicker} onOpenChange={(open) => !open && setShowRoutePicker(false)}>
        <DialogContent className="max-h-[60vh]">
          <DialogHeader>
            <DialogTitle>选择常用线路</DialogTitle>
          </DialogHeader>
          <View className="space-y-2">
            {favoriteRoutes.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-400 text-sm">暂无常用线路</Text>
              </View>
            ) : (
              favoriteRoutes.map((route) => (
                <View
                  key={route.id}
                  className="bg-gray-50 rounded-lg p-3"
                  onClick={() => handleSelectRoute(route)}
                >
                  <View className="flex items-start gap-2 mb-2">
                    <Route size={16} color="#6b7280" />
                    <Text className="block text-sm font-medium text-gray-900 flex-1">
                      {route.route_name}
                    </Text>
                    {route.use_count > 0 && (
                      <Text className="text-xs text-gray-500">
                        使用 {route.use_count} 次
                      </Text>
                    )}
                  </View>
                  <View className="ml-6">
                    <Text className="block text-xs text-gray-600 mb-1">
                      取：{route.pickup_address?.address || '-'}
                    </Text>
                    <Text className="block text-xs text-gray-600">
                      送：{route.delivery_address?.address || '-'}
                    </Text>
                    {route.estimated_distance && (
                      <Text className="block text-xs text-green-600 mt-1">
                        距离：{route.estimated_distance.toFixed(2)} 公里
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoutePicker(false)}
            >
              <Text className="text-xs">取消</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}
