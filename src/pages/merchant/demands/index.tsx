import { useEffect, useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

export default function MerchantDemands() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cargo_name: '',
    cargo_type: 'normal',
    weight: '',
    volume: '',
    pickup_time: '',
    pickup_address: '',
    delivery_address: '',
    remarks: ''
  })

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

  const handleCreateDemand = () => {
    setShowAddForm(true)
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setFormData({
      cargo_name: '',
      cargo_type: 'normal',
      weight: '',
      volume: '',
      pickup_time: '',
      pickup_address: '',
      delivery_address: '',
      remarks: ''
    })
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

  const handleSubmit = async () => {
    if (!formData.cargo_name || !formData.weight || !formData.volume ||
        !formData.pickup_time || !formData.pickup_address || !formData.delivery_address) {
      Taro.showToast({
        title: '请填写完整信息',
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
          ...formData
        }
      })

      console.log('创建需求响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '需求发布成功',
          icon: 'success'
        })

        setShowAddForm(false)
        setFormData({
          cargo_name: '',
          cargo_type: 'normal',
          weight: '',
          volume: '',
          pickup_time: '',
          pickup_address: '',
          delivery_address: '',
          remarks: ''
        })

        // 重新加载需求列表
        loadDemands()
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
      <View className="px-4 py-4">
        {/* 需求列表 */}
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              我的需求
            </CardTitle>
            <Button
              size="sm"
              className="bg-blue-500"
              onClick={handleCreateDemand}
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
                  onClick={handleCreateDemand}
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

        {/* 发布需求表单 */}
        {showAddForm && (
          <Card className="bg-white rounded-lg shadow-sm">
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
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="请输入取货地址"
                      value={formData.pickup_address}
                      onInput={(e) => setFormData({ ...formData, pickup_address: e.detail.value })}
                    />
                  </View>
                </View>

                <View>
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>送货地址
                  </Label>
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="请输入送货地址"
                      value={formData.delivery_address}
                      onInput={(e) => setFormData({ ...formData, delivery_address: e.detail.value })}
                    />
                  </View>
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
                    onClick={handleCancelAdd}
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
        )}
      </View>
    </View>
  )
}
