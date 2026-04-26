import { useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Route, BookOpen } from 'lucide-react-taro'
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
  manualInputMode: 'pickup' | 'delivery' | null
  manualLat: string
  manualLng: string
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
    is_calculating: false,
    manualInputMode: null,
    manualLat: '',
    manualLng: ''
  })

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

  const handleChooseLocation = async (type: 'pickup' | 'delivery') => {
    try {
      const env = Taro.getEnv()
      const isMiniApp = env === Taro.ENV_TYPE.WEAPP || env === Taro.ENV_TYPE.TT

      if (!isMiniApp) {
        // H5 环境：切换到手动输入模式
        if (type === 'pickup') {
          setFormData({
            ...formData,
            manualInputMode: type
          })
        } else {
          setFormData({
            ...formData,
            manualInputMode: type
          })
        }
        return
      }

      // 小程序环境：使用 Taro.chooseLocation
      const location = await Taro.chooseLocation({
        latitude: 39.90469,
        longitude: 116.40717
      })

      console.log('选择位置:', location)

      if (location) {
        const locationData = {
          latitude: location.latitude,
          longitude: location.longitude
        }

        let newFormData = { ...formData }

        if (type === 'pickup') {
          newFormData.pickup_address = location.name || location.address
          newFormData.pickup_location = locationData
        } else {
          newFormData.delivery_address = location.name || location.address
          newFormData.delivery_location = locationData
        }

        setFormData(newFormData)

        // 如果两个位置都有，触发距离计算
        if (newFormData.pickup_location && newFormData.delivery_location) {
          await calculateDistance(newFormData)
        }
      }
    } catch (error) {
      console.error('选择位置失败:', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        return
      }
      Taro.showToast({
        title: '选择位置失败',
        icon: 'none'
      })
    }
  }

  const handleManualLocationConfirm = (type: 'pickup' | 'delivery', lat: number, lng: number) => {
    console.log('[handleManualLocationConfirm] type:', type, 'lat:', lat, 'lng:', lng, 'isNaN(lat):', Number.isNaN(lat), 'isNaN(lng):', Number.isNaN(lng))

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Taro.showToast({
        title: '请输入有效的坐标',
        icon: 'none'
      })
      return
    }

    if (lat < -90 || lat > 90) {
      Taro.showToast({
        title: '纬度范围错误（-90到90）',
        icon: 'none'
      })
      return
    }

    if (lng < -180 || lng > 180) {
      Taro.showToast({
        title: '经度范围错误（-180到180）',
        icon: 'none'
      })
      return
    }

    const locationData = { latitude: lat, longitude: lng }

    let newFormData = { ...formData }

    if (type === 'pickup') {
      newFormData.pickup_address = `(${lat.toFixed(6)}, ${lng.toFixed(6)})`
      newFormData.pickup_location = locationData
    } else {
      newFormData.delivery_address = `(${lat.toFixed(6)}, ${lng.toFixed(6)})`
      newFormData.delivery_location = locationData
    }

    newFormData.manualInputMode = null
    setFormData(newFormData)

    // 如果两个位置都有，触发距离计算
    if (newFormData.pickup_location && newFormData.delivery_location) {
      calculateDistance(newFormData)
    }

    Taro.showToast({
      title: '位置设置成功',
      icon: 'success'
    })
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
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/favorite-routes/index' })}
            >
              <Route size={16} color="#6b7280" />
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

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>取货地址
              </Label>
              <View className="flex gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入取货地址或点击定位"
                    value={formData.pickup_address}
                    onInput={(e) => setFormData({ ...formData, pickup_address: e.detail.value })}
                  />
                </View>
                <Button
                  size="sm"
                  className="bg-blue-500 px-4"
                  onClick={() => handleChooseLocation('pickup')}
                >
                  <Text className="text-xs">定位</Text>
                </Button>
              </View>

              {/* H5 手动输入坐标 */}
              {formData.manualInputMode === 'pickup' && (
                <View className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <Text className="block text-sm font-medium text-blue-900 mb-2">手动输入坐标（H5环境）</Text>
                  <View className="flex gap-2 mb-2">
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-600 mb-1">纬度（-90到90）</Text>
                      <View className="bg-white rounded px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="例：39.908822"
                          type="digit"
                          value={formData.manualLat}
                          onInput={(e) => setFormData({ ...formData, manualLat: e.detail.value })}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-600 mb-1">经度（-180到180）</Text>
                      <View className="bg-white rounded px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="例：116.397499"
                          type="digit"
                          value={formData.manualLng}
                          onInput={(e) => setFormData({ ...formData, manualLng: e.detail.value })}
                        />
                      </View>
                    </View>
                  </View>
                  <Text className="block text-xs text-gray-500 mb-2">
                    💡 提示：点击下方示例可直接复制
                  </Text>
                  <View className="flex gap-1 mb-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-200"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, manualLat: '39.908822', manualLng: '116.397499' })}
                    >
                      <Text className="text-xs">北京朝阳</Text>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-200"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, manualLat: '31.230416', manualLng: '121.473701' })}
                    >
                      <Text className="text-xs">上海黄浦</Text>
                    </Button>
                  </View>
                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500"
                      onClick={() => {
                        const lat = parseFloat(formData.manualLat)
                        const lng = parseFloat(formData.manualLng)
                        if (formData.manualLat && formData.manualLng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
                          handleManualLocationConfirm('pickup', lat, lng)
                        } else {
                          Taro.showToast({
                            title: '请先输入坐标',
                            icon: 'none'
                          })
                        }
                      }}
                    >
                      <Text className="text-xs">确认</Text>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, manualInputMode: null, manualLat: '', manualLng: '' })}
                    >
                      <Text className="text-xs">取消</Text>
                    </Button>
                  </View>
                </View>
              )}

              {formData.pickup_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择位置：{formData.pickup_location.latitude.toFixed(6)}, {formData.pickup_location.longitude.toFixed(6)}
                </Text>
              )}
              <Text className="block text-xs text-gray-400 mt-1">
                提示：小程序可地图选择，H5点击&ldquo;定位&rdquo;后手动输入坐标
              </Text>
            </View>

            <View>
              <Label className="block text-sm font-medium mb-2">
                <Text className="text-red-500">*</Text>送货地址
              </Label>
              <View className="flex gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入送货地址或点击定位"
                    value={formData.delivery_address}
                    onInput={(e) => setFormData({ ...formData, delivery_address: e.detail.value })}
                  />
                </View>
                <Button
                  size="sm"
                  className="bg-blue-500 px-4"
                  onClick={() => handleChooseLocation('delivery')}
                >
                  <Text className="text-xs">定位</Text>
                </Button>
              </View>

              {/* H5 手动输入坐标 */}
              {formData.manualInputMode === 'delivery' && (
                <View className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <Text className="block text-sm font-medium text-blue-900 mb-2">手动输入坐标（H5环境）</Text>
                  <View className="flex gap-2 mb-2">
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-600 mb-1">纬度（-90到90）</Text>
                      <View className="bg-white rounded px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="例：39.918822"
                          type="digit"
                          value={formData.manualLat}
                          onInput={(e) => setFormData({ ...formData, manualLat: e.detail.value })}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-xs text-gray-600 mb-1">经度（-180到180）</Text>
                      <View className="bg-white rounded px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="例：116.407499"
                          type="digit"
                          value={formData.manualLng}
                          onInput={(e) => setFormData({ ...formData, manualLng: e.detail.value })}
                        />
                      </View>
                    </View>
                  </View>
                  <Text className="block text-xs text-gray-500 mb-2">
                    💡 提示：点击下方示例可直接复制
                  </Text>
                  <View className="flex gap-1 mb-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-200"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, manualLat: '39.918822', manualLng: '116.407499' })}
                    >
                      <Text className="text-xs">北京海淀</Text>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gray-200"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, manualLat: '31.229553', manualLng: '121.469321' })}
                    >
                      <Text className="text-xs">上海静安</Text>
                    </Button>
                  </View>
                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500"
                      onClick={() => {
                        const lat = parseFloat(formData.manualLat)
                        const lng = parseFloat(formData.manualLng)
                        if (formData.manualLat && formData.manualLng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
                          handleManualLocationConfirm('delivery', lat, lng)
                        } else {
                          Taro.showToast({
                            title: '请先输入坐标',
                            icon: 'none'
                          })
                        }
                      }}
                    >
                      <Text className="text-xs">确认</Text>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, manualInputMode: null, manualLat: '', manualLng: '' })}
                    >
                      <Text className="text-xs">取消</Text>
                    </Button>
                  </View>
                </View>
              )}

              {formData.delivery_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择位置：{formData.delivery_location.latitude.toFixed(6)}, {formData.delivery_location.longitude.toFixed(6)}
                </Text>
              )}
              <Text className="block text-xs text-gray-400 mt-1">
                提示：小程序可地图选择，H5点击&ldquo;定位&rdquo;后手动输入坐标
              </Text>
            </View>

            {/* 距离测算卡片 */}
            {formData.is_calculating && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <View className="flex items-center justify-center">
                    <Text className="text-sm text-blue-600">🔄 正在计算距离...</Text>
                  </View>
                </CardContent>
              </Card>
            )}

            {formData.estimated_distance !== null && formData.estimated_fare !== null && !formData.is_calculating && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <View className="space-y-2">
                    <View className="flex items-center justify-between">
                      <Text className="text-sm font-medium text-green-800">📊 距离测算</Text>
                    </View>
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-green-700">📏 预估距离</Text>
                      <Text className="text-sm font-bold text-green-700">{formData.estimated_distance.toFixed(2)} 公里</Text>
                    </View>
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-green-700">💰 预估运费</Text>
                      <Text className="text-lg font-bold text-green-600">¥{formData.estimated_fare.toFixed(2)}</Text>
                    </View>
                    <Text className="block text-xs text-green-600 text-center mt-2">
                      📝 注：按非高速路线计算，每公里1元
                    </Text>
                  </View>
                </CardContent>
              </Card>
            )}

            <View>
              <Label className="block text-sm font-medium mb-2">
                备注（可选）
              </Label>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：需要冷藏"
                  value={formData.remarks}
                  onInput={(e) => setFormData({ ...formData, remarks: e.detail.value })}
                />
              </View>
            </View>

            <View className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-gray-200"
                onClick={() => Taro.navigateBack()}
              >
                <Text>取消</Text>
              </Button>
              <Button
                className="flex-1 bg-blue-500"
                onClick={handleSubmit}
                disabled={loading}
              >
                <Text>{loading ? '发布中...' : '发布'}</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
