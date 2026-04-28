import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { User, Settings, CircleQuestionMark, LogOut } from 'lucide-react-taro'
import './index.css'

export default function EnterpriseProfile() {
  return (
    <View className="enterprise-profile">
      {/* 用户信息卡片 */}
      <Card className="profile-card">
        <CardContent className="profile-content">
          <View className="user-avatar">
            <User size={48} color="#1890ff" />
          </View>
          <Text className="user-name">企业管理员</Text>
          <Text className="user-role">XX物流企业</Text>
        </CardContent>
      </Card>

      {/* 功能菜单 */}
      <Card className="menu-card">
        <CardContent className="menu-content">
          <View className="menu-item">
            <View className="menu-icon">
              <Settings size={20} color="#1890ff" />
            </View>
            <Text className="menu-text">系统设置</Text>
          </View>
          <View className="menu-divider"></View>
          <View className="menu-item">
            <View className="menu-icon">
              <CircleQuestionMark size={20} color="#1890ff" />
            </View>
            <Text className="menu-text">帮助中心</Text>
          </View>
          <View className="menu-divider"></View>
          <View className="menu-item">
            <View className="menu-icon">
              <LogOut size={20} color="#ff4d4f" />
            </View>
            <Text className="menu-text logout">退出登录</Text>
          </View>
        </CardContent>
      </Card>

      {/* 版本信息 */}
      <View className="version-info">
        <Text className="version-text">版本 1.0.0</Text>
      </View>
    </View>
  )
}
