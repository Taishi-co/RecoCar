import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { House, Truck, Clipboard, Globe, User } from 'lucide-react-taro'
import './index.css'

interface EnterpriseTabBarProps {
  activeTab: string
}

export default function EnterpriseTabBar({ activeTab }: EnterpriseTabBarProps) {
  const tabs = [
    {
      key: 'dashboard',
      title: '首页',
      icon: House,
      path: '/pages/enterprise/dashboard/index',
    },
    {
      key: 'fleet',
      title: '车队',
      icon: Truck,
      path: '/pages/enterprise/fleet/list',
    },
    {
      key: 'dispatch',
      title: '调度',
      icon: Clipboard,
      path: '/pages/enterprise/dispatch/list',
    },
    {
      key: 'external',
      title: '外单',
      icon: Globe,
      path: '/pages/enterprise/external/orders',
    },
    {
      key: 'profile',
      title: '我的',
      icon: User,
      path: '/pages/enterprise/profile/index',
    },
  ]

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.key === activeTab) return

    Taro.switchTab({
      url: tab.path,
    })
  }

  return (
    <View className="enterprise-tab-bar">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        const Icon = tab.icon

        return (
          <View
            key={tab.key}
            className={`tab-item ${isActive ? 'tab-item-active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            <Icon size={24} color={isActive ? '#1890ff' : '#999999'} />
            <Text className={`tab-text ${isActive ? 'tab-text-active' : ''}`}>
              {tab.title}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
