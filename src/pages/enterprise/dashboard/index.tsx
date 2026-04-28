import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, ClipboardList, ChevronRight } from 'lucide-react-taro'
import './index.css'

export default function EnterpriseDashboard() {
  const stats = {
    vehicleCount: 15,
    orderCount: 25,
    revenue: 1250,
    idleVehicles: 4,
    busyVehicles: 8,
    maintenanceVehicles: 3,
  }

  const pendingTasks = [
    { id: 1, title: '3个待调度订单', urgent: true },
    { id: 2, title: '1个车辆需要维护', urgent: false },
  ]

  return (
    <View className="enterprise-dashboard">
      {/* 头部 */}
      <View className="header">
        <Text className="header-title">企业工作台</Text>
        <Text className="header-subtitle">今日概览</Text>
      </View>

      {/* 统计卡片 */}
      <View className="stats-container">
        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon">
              <Truck size={32} color="#1890ff" />
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.vehicleCount}</Text>
              <Text className="stat-label">车辆数</Text>
            </View>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon">
              <ClipboardList size={32} color="#52c41a" />
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.orderCount}</Text>
              <Text className="stat-label">订单数</Text>
            </View>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon">
              <Text className="stat-icon-text">¥</Text>
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.revenue}</Text>
              <Text className="stat-label">今日收益</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 车辆状态分布 */}
      <Card className="status-card">
        <CardHeader>
          <CardTitle className="card-title">车辆状态分布</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <View className="status-row">
            <Badge variant="secondary" className="status-badge">空闲</Badge>
            <Text className="status-text">{stats.idleVehicles}辆  {Math.round(stats.idleVehicles / stats.vehicleCount * 100)}%</Text>
          </View>
          <View className="status-row">
            <Badge className="status-badge status-badge-busy">执行中</Badge>
            <Text className="status-text">{stats.busyVehicles}辆  {Math.round(stats.busyVehicles / stats.vehicleCount * 100)}%</Text>
          </View>
          <View className="status-row">
            <Badge variant="destructive" className="status-badge">维修中</Badge>
            <Text className="status-text">{stats.maintenanceVehicles}辆  {Math.round(stats.maintenanceVehicles / stats.vehicleCount * 100)}%</Text>
          </View>
        </CardContent>
      </Card>

      {/* 待处理事项 */}
      <Card className="tasks-card">
        <CardHeader>
          <CardTitle className="card-title">待处理事项</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          {pendingTasks.map((task) => (
            <View key={task.id} className="task-item">
              <View className="task-info">
                <Text className="task-title">{task.title}</Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  )
}
