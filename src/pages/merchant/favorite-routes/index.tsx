import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Route, MapPin, Navigation } from 'lucide-react-taro'

interface Address {
  id: string
  address_name: string
  address: string
  latitude: number
  longitude: number
}

interface FavoriteRoute {
  id: string
  route_name: string
  pickup_address: Address | null
  delivery_address: Address | null
  estimated_distance: number | null
  estimated_fare: number | null
  use_count: number
  created_at: string
}

export default function FavoriteRoutes() {
  const [routes, setRoutes] = useState<FavoriteRoute[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    route_name: '',
    pickup_address_id: '',
    delivery_address_id: '',
    estimated_distance: '',
    estimated_fare: ''
  })

  useEffect(() => {
    loadRoutes()
    loadAddresses()
  }, [])

  const loadRoutes = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: '/api/favorite-routes',
        data: { user_id: userInfo.id }
      })

      console.log('[FavoriteRoutes] 线路列表响应:', res.data)

      if (res.data.code === 200) {
        setRoutes(res.data.data || [])
      }
    } catch (error) {
      console.error('[FavoriteRoutes] 加载线路列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }

  const loadAddresses = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: '/api/address-books',
        data: { user_id: userInfo.id }
      })

      console.log('[FavoriteRoutes] 地址列表响应:', res.data)

      if (res.data.code === 200) {
        setAddresses(res.data.data || [])
      }
    } catch (error) {
      console.error('[FavoriteRoutes] 加载地址列表失败:', error)
    }
  }

  const handleAddRoute = async () => {
    if (!formData.route_name || !formData.pickup_address_id || !formData.delivery_address_id) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (formData.pickup_address_id === formData.delivery_address_id) {
      Taro.showToast({
        title: '取货地址和收货地址不能相同',
        icon: 'none'
      })
      return
    }

    setLoading(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')

      const res = await Network.request({
        url: '/api/favorite-routes',
        method: 'POST',
        data: {
          user_id: userInfo.id,
          route_name: formData.route_name,
          pickup_address_id: formData.pickup_address_id,
          delivery_address_id: formData.delivery_address_id,
          estimated_distance: formData.estimated_distance ? parseFloat(formData.estimated_distance) : null,
          estimated_fare: formData.estimated_fare ? parseFloat(formData.estimated_fare) : null
        }
      })

      console.log('[FavoriteRoutes] 添加线路响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })

        setShowAddForm(false)
        setFormData({
          route_name: '',
          pickup_address_id: '',
          delivery_address_id: '',
          estimated_distance: '',
          estimated_fare: ''
        })

        loadRoutes()
      } else {
        Taro.showToast({
          title: res.data.message || '添加失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('[FavoriteRoutes] 添加线路失败:', error)
      Taro.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const modalRes = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这条线路吗？'
      })

      if (modalRes.confirm) {
        const res = await Network.request({
          url: `/api/favorite-routes/${id}`,
          method: 'DELETE'
        })

        if (res.data.code === 200) {
          Taro.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadRoutes()
        }
      }
    } catch (error) {
      console.error('[FavoriteRoutes] 删除线路失败:', error)
    }
  }

  const handleUseRoute = async (route: FavoriteRoute) => {
    try {
      // 增加使用次数
      await Network.request({
        url: `/api/favorite-routes/${route.id}/increment-use-count`,
        method: 'POST'
      })

      // 跳转到发布需求页面，并传递线路信息
      Taro.navigateTo({
        url: `/pages/merchant/demands/publish?route=${JSON.stringify(route)}`
      })
    } catch (error) {
      console.error('[FavoriteRoutes] 使用线路失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-4">
      {/* 顶部标题栏 */}
      <View className="bg-white p-4 border-b">
        <Text className="text-lg font-semibold text-center">常用线路</Text>
      </View>

      {/* 添加线路按钮 */}
      {!showAddForm && (
        <View className="p-4">
          <Button
            className="w-full bg-blue-500 text-white"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} color="#ffffff" className="mr-2" />
            <Text>添加线路</Text>
          </Button>
        </View>
      )}

      {/* 添加线路表单 */}
      {showAddForm && (
        <Card className="m-4">
          <CardContent className="p-4 space-y-3">
            <View>
              <Text className="block text-sm font-medium mb-1">线路名称</Text>
              <View className="bg-gray-50 rounded px-3 py-2">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：上班路线"
                  value={formData.route_name}
                  onInput={(e) => setFormData({ ...formData, route_name: e.detail.value })}
                />
              </View>
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">取货地址</Text>
              <View className="bg-gray-50 rounded px-3 py-2">
                <Text className="block text-sm text-gray-700">
                  {addresses.find(a => a.id === formData.pickup_address_id)?.address_name || '请选择取货地址'}
                </Text>
              </View>
              <View className="mt-2 flex flex-wrap gap-2">
                {addresses.map(addr => (
                  <Button
                    key={addr.id}
                    size="sm"
                    className={`text-xs ${formData.pickup_address_id === addr.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setFormData({ ...formData, pickup_address_id: addr.id })}
                  >
                    <Text>{addr.address_name}</Text>
                  </Button>
                ))}
              </View>
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">收货地址</Text>
              <View className="bg-gray-50 rounded px-3 py-2">
                <Text className="block text-sm text-gray-700">
                  {addresses.find(a => a.id === formData.delivery_address_id)?.address_name || '请选择收货地址'}
                </Text>
              </View>
              <View className="mt-2 flex flex-wrap gap-2">
                {addresses.map(addr => (
                  <Button
                    key={addr.id}
                    size="sm"
                    className={`text-xs ${formData.delivery_address_id === addr.id ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setFormData({ ...formData, delivery_address_id: addr.id })}
                  >
                    <Text>{addr.address_name}</Text>
                  </Button>
                ))}
              </View>
            </View>

            <View className="flex gap-2">
              <View className="flex-1">
                <Text className="block text-sm font-medium mb-1">预估距离（公里）</Text>
                <View className="bg-gray-50 rounded px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="可选"
                    type="digit"
                    value={formData.estimated_distance}
                    onInput={(e) => setFormData({ ...formData, estimated_distance: e.detail.value })}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-medium mb-1">预估运费（元）</Text>
                <View className="bg-gray-50 rounded px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="可选"
                    type="digit"
                    value={formData.estimated_fare}
                    onInput={(e) => setFormData({ ...formData, estimated_fare: e.detail.value })}
                  />
                </View>
              </View>
            </View>

            <View className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({
                    route_name: '',
                    pickup_address_id: '',
                    delivery_address_id: '',
                    estimated_distance: '',
                    estimated_fare: ''
                  })
                }}
              >
                <Text>取消</Text>
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-500"
                onClick={handleAddRoute}
                disabled={loading}
              >
                <Text>确认添加</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

      {/* 线路列表 */}
      <View className="px-4 space-y-3">
        {routes.map((route) => (
          <Card key={route.id} className="border-2">
            <CardContent className="p-4">
              <View className="flex items-start justify-between mb-3">
                <View className="flex items-center gap-2">
                  <Route size={20} color="#3b82f6" />
                  <Text className="font-semibold text-lg">{route.route_name}</Text>
                </View>
                <View className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-500"
                    onClick={() => handleUseRoute(route)}
                  >
                    <Navigation size={16} color="#ffffff" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500"
                    onClick={() => handleDelete(route.id)}
                  >
                    <Trash2 size={16} color="#ffffff" />
                  </Button>
                </View>
              </View>

              <View className="space-y-2 mb-3">
                <View className="flex items-start gap-2">
                  <MapPin size={16} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="block text-sm font-medium text-gray-900">
                      {route.pickup_address?.address_name || '取货地址'}
                    </Text>
                    <Text className="block text-xs text-gray-500">
                      {route.pickup_address?.address}
                    </Text>
                  </View>
                </View>

                <View className="flex items-start gap-2">
                  <MapPin size={16} color="#10b981" />
                  <View className="flex-1">
                    <Text className="block text-sm font-medium text-gray-900">
                      {route.delivery_address?.address_name || '收货地址'}
                    </Text>
                    <Text className="block text-xs text-gray-500">
                      {route.delivery_address?.address}
                    </Text>
                  </View>
                </View>
              </View>

              {(route.estimated_distance || route.estimated_fare) && (
                <View className="flex gap-4 pt-2 border-t">
                  {route.estimated_distance && (
                    <Text className="text-sm text-gray-600">
                      📏 {route.estimated_distance}公里
                    </Text>
                  )}
                  {route.estimated_fare && (
                    <Text className="text-sm text-gray-600">
                      💰 ¥{route.estimated_fare.toFixed(2)}
                    </Text>
                  )}
                  {route.use_count > 0 && (
                    <Text className="text-sm text-gray-600">
                      使用 {route.use_count} 次
                    </Text>
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        ))}

        {routes.length === 0 && !showAddForm && (
          <View className="flex flex-col items-center justify-center py-12">
            <Route size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-4">暂无线路</Text>
            <Text className="text-gray-400 text-sm mt-1">点击上方按钮添加常用线路</Text>
          </View>
        )}
      </View>
    </View>
  )
}
