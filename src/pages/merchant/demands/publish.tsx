import { useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    remarks: ''
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
        Taro.showToast({
          title: '地图定位仅在小程序中可用',
          icon: 'none'
        })
        return
      }

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

        if (type === 'pickup') {
          setFormData({
            ...formData,
            pickup_address: location.name || location.address,
            pickup_location: locationData
          })
        } else {
          setFormData({
            ...formData,
            delivery_address: location.name || location.address,
            delivery_location: locationData
          })
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
          remarks: formData.remarks
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
                    placeholder="请输入取货地址"
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
              {formData.pickup_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择位置：{formData.pickup_location.latitude.toFixed(6)}, {formData.pickup_location.longitude.toFixed(6)}
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
                    placeholder="请输入送货地址"
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
              {formData.delivery_location && (
                <Text className="block text-xs text-gray-400 mt-1">
                  已选择位置：{formData.delivery_location.latitude.toFixed(6)}, {formData.delivery_location.longitude.toFixed(6)}
                </Text>
              )}
            </View>

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
