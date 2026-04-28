import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import './index.css'

const EnterpriseFleetPage: FC = () => {
  useLoad(() => {
    console.log('车队管理加载')
  })

  return (
    <View className="enterprise-fleet min-h-screen bg-gray-50 pb-20">
      <View className="p-4">
        {/* 统计信息 */}
        <View className="bg-blue-50 p-4 rounded-lg mb-4">
          <Text className="text-gray-900 font-medium block">
            我的车辆：15辆  执行中：8辆  空闲：5辆
          </Text>
          <Text className="text-green-600 text-sm mt-1 block">
            空闲-对外：2辆
          </Text>
        </View>

        {/* 车辆列表 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">车辆M-001 中型车</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="text-sm text-gray-600 mb-3">
              <Text className="block">车牌：冀B·M0001</Text>
              <Text className="block">载重：1.5吨</Text>
              <Text className="block">状态：空闲-对外</Text>
              <Text className="block">位置：配送中心</Text>
            </View>

            <Text className="text-sm font-medium text-gray-900 mb-2 block">今日统计：</Text>
            <View className="text-xs text-gray-600 mb-3">
              <Text className="block">- 内部订单：2单</Text>
              <Text className="block">- 外部订单：1单</Text>
              <Text className="block">- 总行驶：35km</Text>
            </View>

            <View className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">查看详情</Button>
              <Button size="sm" variant="outline" className="flex-1">设置为内部</Button>
              <Button size="sm" className="flex-1">设置为对外</Button>
            </View>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">车辆M-002 中型车</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="text-sm text-gray-600 mb-3">
              <Text className="block">车牌：冀B·M0002</Text>
              <Text className="block">载重：1.5吨</Text>
              <Text className="block">状态：执行-内部</Text>
              <Text className="block">位置：配送中</Text>
            </View>

            <Text className="text-sm font-medium text-gray-900 mb-2 block">当前任务：</Text>
            <View className="text-xs text-gray-600 mb-3">
              <Text className="block">- 配送单：INT20260427001</Text>
              <Text className="block">- 路线：仓库→奶站1→...→奶站8</Text>
              <Text className="block">- 进度：60%  预计完成：15:30</Text>
            </View>

            <View className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">查看详情</Button>
              <Button size="sm" className="flex-1">实时监控</Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default EnterpriseFleetPage
