import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Vehicle {
  id: string
  vehicle_type: string
  load_capacity: number
  volume: number
  battery_life: number
  status: string
  photos: any
  created_at: string
}

export default function OwnerVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_type: '',
    load_capacity: '',
    volume: '',
    battery_life: ''
  })

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'owner') {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
      return
    }
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    const userInfo = Taro.getStorageSync('userInfo')
    try {
      const res = await Network.request({
        url: '/api/vehicles',
        data: { owner_id: userInfo.id }
      })

      console.log('车辆列表响应:', res.data)

      if (res.data.code === 200) {
        setVehicles(res.data.data)
      }
    } catch (error) {
      console.error('加载车辆列表失败:', error)
    }
  }

  const handleAddVehicle = () => {
    setShowAddForm(true)
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setFormData({
      vehicle_type: '',
      load_capacity: '',
      volume: '',
      battery_life: ''
    })
  }

  const handleSubmit = async () => {
    if (!formData.vehicle_type || !formData.load_capacity || !formData.volume || !formData.battery_life) {
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
        url: '/api/vehicles',
        method: 'POST',
        data: {
          owner_id: userInfo.id,
          ...formData
        }
      })

      console.log('创建车辆响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '车辆注册成功，等待审核',
          icon: 'success'
        })

        setShowAddForm(false)
        setFormData({
          vehicle_type: '',
          load_capacity: '',
          volume: '',
          battery_life: ''
        })

        // 重新加载车辆列表
        loadVehicles()
      } else {
        Taro.showToast({
          title: res.data.message || '注册失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('注册车辆失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (vehicleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const res = await Network.request({
        url: `/api/vehicles/${vehicleId}/status?id=${vehicleId}`,
        method: 'PUT',
        data: { status: newStatus }
      })

      console.log('更新状态响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '状态更新成功',
          icon: 'success'
        })
        loadVehicles()
      } else {
        Taro.showToast({
          title: res.data.message || '更新失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '可用'
      case 'inactive':
        return '不可用'
      case 'pending':
        return '待审核'
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
              className="bg-blue-500"
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
        {/* 车辆列表 */}
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              我的车辆
            </CardTitle>
            <Button
              size="sm"
              className="bg-blue-500"
              onClick={handleAddVehicle}
            >
              <Text>注册车辆</Text>
            </Button>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm mb-4">
                  您还没有注册车辆
                </Text>
                <Button
                  className="bg-blue-500"
                  onClick={handleAddVehicle}
                >
                  <Text>注册车辆</Text>
                </Button>
              </View>
            ) : (
              <View className="space-y-3">
                {vehicles.map((vehicle) => (
                  <View key={vehicle.id} className="bg-gray-50 rounded-lg p-4">
                    <View className="flex justify-between items-start mb-3">
                      <View>
                        <Text className="block font-medium text-base mb-1">
                          {vehicle.vehicle_type}
                        </Text>
                        <View className="flex items-center gap-2">
                          <Badge className={getStatusColor(vehicle.status)}>
                            <Text className="text-white text-xs">
                              {getStatusText(vehicle.status)}
                            </Text>
                          </Badge>
                          <Text className="text-xs text-gray-500">
                            载重: {vehicle.load_capacity}kg | 体积: {vehicle.volume}m³ | 续航: {vehicle.battery_life}km
                          </Text>
                        </View>
                      </View>
                      {vehicle.status === 'active' || vehicle.status === 'inactive' ? (
                        <View onClick={() => handleToggleStatus(vehicle.id, vehicle.status)}>
                          <Switch
                            checked={vehicle.status === 'active'}
                          />
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xs text-gray-400">
                      注册时间: {new Date(vehicle.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* 添加车辆表单 */}
        {showAddForm && (
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                注册车辆
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                <View>
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>车型
                  </Label>
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：小型无人配送车"
                      value={formData.vehicle_type}
                      onInput={(e) => setFormData({ ...formData, vehicle_type: e.detail.value })}
                    />
                  </View>
                </View>

                <View>
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>载重（公斤）
                  </Label>
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：50"
                      type="number"
                      value={formData.load_capacity}
                      onInput={(e) => setFormData({ ...formData, load_capacity: e.detail.value })}
                    />
                  </View>
                </View>

                <View>
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>体积（立方米）
                  </Label>
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：0.5"
                      type="digit"
                      value={formData.volume}
                      onInput={(e) => setFormData({ ...formData, volume: e.detail.value })}
                    />
                  </View>
                </View>

                <View>
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>续航（公里）
                  </Label>
                  <View className="bg-gray-50 rounded-lg px-4 py-3">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：100"
                      type="number"
                      value={formData.battery_life}
                      onInput={(e) => setFormData({ ...formData, battery_life: e.detail.value })}
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
                    <Text>{loading ? '提交中...' : '提交'}</Text>
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
