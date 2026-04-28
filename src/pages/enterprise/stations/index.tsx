import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import './index.css'

const EnterpriseStationsPage: FC = () => {
  return (
    <View className="enterprise-stations min-h-screen bg-gray-50 p-4">
      <Text className="text-2xl font-bold">奶站管理</Text>
      <Text className="text-sm text-gray-600 mt-2">功能开发中...</Text>
    </View>
  )
}

export default EnterpriseStationsPage
