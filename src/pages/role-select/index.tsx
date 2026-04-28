import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Box, Truck, Building2, ArrowRight } from 'lucide-react-taro'
import './index.css'

export default function RoleSelect() {
  const roles = [
    {
      id: 'merchant',
      title: '需求方',
      description: '发布需求，查找运力',
      icon: Box,
      color: '#52c41a',
      path: '/pages/merchant/demands/index',
    },
    {
      id: 'owner',
      title: '运力方',
      description: '接单配送，管理车辆',
      icon: Truck,
      color: '#1890ff',
      path: '/pages/owner/orders/index',
    },
    {
      id: 'enterprise',
      title: '企业端',
      description: '车队管理，调度中心',
      icon: Building2,
      color: '#722ed1',
      path: '/pages/enterprise/dashboard/index',
    },
  ]

  const handleRoleSelect = (role: typeof roles[0]) => {
    Taro.switchTab({
      url: role.path,
      fail: () => {
        Taro.redirectTo({
          url: role.path,
        })
      },
    })
  }

  return (
    <View className="role-select">
      <View className="header">
        <Text className="header-title">选择您的身份</Text>
        <Text className="header-subtitle">根据您的需求选择合适的角色</Text>
      </View>

      <View className="roles-container">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.id} className="role-card" onClick={() => handleRoleSelect(role)}>
              <CardContent className="role-content">
                <View className="role-icon" style={{ backgroundColor: `${role.color}20` }}>
                  <Icon size={40} color={role.color} />
                </View>
                <View className="role-info">
                  <Text className="role-title">{role.title}</Text>
                  <Text className="role-description">{role.description}</Text>
                </View>
                <ArrowRight size={20} color="#999" />
              </CardContent>
            </Card>
          )
        })}
      </View>
    </View>
  )
}
