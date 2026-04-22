import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'

export default function MerchantDemands() {
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
    }
  }, [])

  const handleCreateDemand = () => {
    Taro.showToast({
      title: '需求发布功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              需求方端 - 发布需求
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="text-center py-8">
              <Text className="block text-gray-500 text-sm mb-4">
                发布运输需求，快速匹配合适车辆
              </Text>
              <Button
                className="w-full bg-blue-500"
                onClick={handleCreateDemand}
              >
                <Text>发布需求</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              需求列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-500 text-center py-4">
              暂无需求记录
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
