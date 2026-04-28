import { View, Text } from '@tarojs/components'
import { useEffect } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import Taro from '@tarojs/taro'
import './index.css'

const EnterpriseHomePage: FC = () => {
  useEffect(() => {
    console.log('企业首页加载')
  }, [])

  const navigateToFleet = () => {
    console.log('点击车辆管理')
    Taro.navigateTo({ url: '/pages/enterprise/fleet/index' })
  }

  const navigateToDispatch = () => {
    console.log('点击发布配送')
    Taro.navigateTo({ url: '/pages/enterprise/dispatch/index' })
  }

  const navigateToStations = () => {
    console.log('点击奶站管理')
    Taro.navigateTo({ url: '/pages/enterprise/stations/index' })
  }

  return (
    <View className="enterprise-home min-h-screen bg-gray-50 pb-20">
      {/* 顶部信息栏 */}
      <View className="bg-blue-500 px-4 py-6">
        <Text className="text-white text-xl font-bold">蒙牛奶制品唐山配送中心</Text>
        <Text className="text-blue-100 text-sm mt-2 block">2026年4月27日 星期一</Text>
      </View>

      {/* 今日概览 */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-4 block">今日概览</Text>
        <View className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Text className="text-2xl font-bold text-gray-900 block">15</Text>
              <Text className="text-xs text-gray-500 mt-1 block">待发</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Text className="text-2xl font-bold text-gray-900 block">8</Text>
              <Text className="text-xs text-gray-500 mt-1 block">进行</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Text className="text-2xl font-bold text-gray-900 block">32</Text>
              <Text className="text-xs text-gray-500 mt-1 block">已达</Text>
            </CardContent>
          </Card>
        </View>

        <View className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Text className="text-2xl font-bold text-blue-500 block">12</Text>
              <Text className="text-xs text-gray-500 mt-1 block">自有车</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Text className="text-2xl font-bold text-green-500 block">3</Text>
              <Text className="text-xs text-gray-500 mt-1 block">外部车</Text>
            </CardContent>
          </Card>
        </View>

        {/* 待处理事项 */}
        <Text className="text-lg font-bold text-gray-900 mb-4 block">待处理事项</Text>
        <Card className="mb-3">
          <CardContent className="p-4">
            <Text className="text-sm text-gray-900 font-medium block mb-2">📋 3个待调度订单</Text>
            <Button size="sm" className="w-full" onClick={navigateToDispatch}>去调度</Button>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardContent className="p-4">
            <Text className="text-sm text-gray-900 font-medium block mb-2">🔔 5个订单已送达</Text>
            <Button size="sm" variant="outline" className="w-full">查看</Button>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Text className="text-lg font-bold text-gray-900 mb-4 block">快捷入口</Text>
        <View className="grid grid-cols-2 gap-3">
          <View
            className="h-20 bg-blue-500 rounded-lg flex items-center justify-center"
            onTap={() => { console.log('发布配送点击'); navigateToDispatch(); }}
            style={{ backgroundColor: '#3b82f6', borderRadius: '8px' }}
          >
            <Text className="text-white text-sm">发布配送</Text>
          </View>
          <View
            className="h-20 border border-gray-300 bg-white rounded-lg flex items-center justify-center"
            onTap={() => { console.log('车辆管理点击'); navigateToFleet(); }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <Text className="text-gray-900 text-sm">车辆管理</Text>
          </View>
          <View
            className="h-20 border border-gray-300 bg-white rounded-lg flex items-center justify-center"
            onTap={() => { console.log('奶站管理点击'); navigateToStations(); }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px' }}
          >
            <Text className="text-gray-900 text-sm">奶站管理</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default EnterpriseHomePage
