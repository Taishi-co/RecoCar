import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'

export default function OwnerVehicles() {
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
    }
  }, [])

  const handleAddVehicle = () => {
    Taro.showToast({
      title: '车辆注册功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              车主端 - 车辆管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="text-center py-8">
              <Text className="block text-gray-500 text-sm mb-4">
                您还没有注册车辆
              </Text>
              <Button
                className="w-full bg-blue-500"
                onClick={handleAddVehicle}
              >
                <Text>注册车辆</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              车辆状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex justify-between items-center">
              <Text className="text-sm text-gray-500">当前状态</Text>
              <Text className="text-sm font-medium text-gray-500">暂无车辆</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
