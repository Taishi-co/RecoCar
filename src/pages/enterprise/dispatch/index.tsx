import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import './index.css'

const EnterpriseDispatchPage: FC = () => {
  useLoad(() => {
    console.log('调度中心加载')
  })

  return (
    <View className="enterprise-dispatch min-h-screen bg-gray-50 pb-20">
      <View className="p-4">
        {/* 筛选栏 */}
        <View className="flex gap-2 mb-4">
          <Button size="sm" variant="outline">全部</Button>
          <Button size="sm" variant="outline">今天</Button>
          <Button size="sm" variant="default">内部</Button>
        </View>

        {/* 待调度订单 */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending">待调度</TabsTrigger>
            <TabsTrigger value="in_transit">进行中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">配送1：仓库→自营奶站</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="text-sm text-gray-600 mb-2">
                  <Text className="block">发布时间：08:30</Text>
                  <Text className="block">紧急程度：普通</Text>
                  <Text className="block">送货点数：8个</Text>
                  <Text className="block">总重量：980kg</Text>
                  <Text className="block">期望时间：14:00-17:00</Text>
                </View>
                <Text className="text-sm text-blue-500 mb-3 block">系统建议：2辆中型车</Text>
                <View className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">查看详情</Button>
                  <Button size="sm" className="flex-1">开始调度</Button>
                </View>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">配送2：仓库→商超</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="text-sm text-gray-600 mb-2">
                  <Text className="block">发布时间：09:00</Text>
                  <Text className="block text-red-500">紧急程度：紧急</Text>
                  <Text className="block">送货点数：12个</Text>
                  <Text className="block">总重量：1500kg</Text>
                  <Text className="block">期望时间：08:00-10:00</Text>
                </View>
                <Text className="text-sm text-blue-500 mb-3 block">系统建议：自有车辆2辆+外部1辆</Text>
                <View className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">查看详情</Button>
                  <Button size="sm" className="flex-1">开始调度</Button>
                </View>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_transit">
            <Card>
              <CardContent className="p-8">
                <Text className="text-gray-500 text-sm block text-center">暂无进行中订单</Text>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="p-8">
                <Text className="text-gray-500 text-sm block text-center">暂无已完成订单</Text>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </View>
    </View>
  )
}

export default EnterpriseDispatchPage
