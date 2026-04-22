import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import './index.css'

export default function OwnerProfile() {
  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              车主端 - 我的
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-gray-500 text-center py-4">
              个人中心功能开发中
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
