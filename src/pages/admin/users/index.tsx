import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Taro from '@tarojs/taro'
import './index.css'

export default function AdminUsers() {
  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo || userInfo.role !== 'admin') {
      Taro.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 1500)
    }
  }, [])

  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              运营端 - 用户管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-500 text-center py-4">
              用户管理功能开发中
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
