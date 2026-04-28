import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import './index.css'

const EnterpriseStatsPage: FC = () => {
  return (
    <View className="enterprise-stats min-h-screen bg-gray-50 p-4">
      <Text className="text-2xl font-bold block">数据统计</Text>
      <Text className="text-sm text-gray-600 mt-2 block">功能开发中...</Text>
    </View>
  )
}

export default EnterpriseStatsPage
