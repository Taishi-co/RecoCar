import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Taro from '@tarojs/taro'

export default function MerchantProfile() {
  const menuItems = [
    {
      id: 'publish',
      title: '发布需求',
      icon: '📝',
      onClick: () => Taro.navigateTo({ url: '/pages/merchant/demands/publish' })
    },
    {
      id: 'demands',
      title: '我的需求',
      icon: '📋',
      onClick: () => Taro.navigateTo({ url: '/pages/merchant/demands/list' })
    },
    {
      id: 'orders',
      title: '订单管理',
      icon: '📦',
      onClick: () => Taro.navigateTo({ url: '/pages/merchant/orders/index' })
    },
    {
      id: 'stats',
      title: '数据统计',
      icon: '📊',
      onClick: () => Taro.navigateTo({ url: '/pages/merchant/stats/index' })
    }
  ]

  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              功能菜单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-2">
              {menuItems.map((item) => (
                <View
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg active:bg-gray-100"
                  onClick={item.onClick}
                >
                  <View className="flex items-center">
                    <Text className="text-2xl mr-3">{item.icon}</Text>
                    <Text className="text-base font-medium">{item.title}</Text>
                  </View>
                  <Text className="text-gray-400">›</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              关于
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-2">
              <Text className="block text-sm text-gray-600">
                版本：1.0.0
              </Text>
              <Text className="block text-sm text-gray-600">
                无人车共享运营平台 - 需求方端
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
