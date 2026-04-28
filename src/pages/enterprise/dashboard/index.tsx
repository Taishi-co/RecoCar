import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, ClipboardList, ArrowRight, Bell, CircleAlert, Check, Clock, Plus, ArrowUpRight } from 'lucide-react-taro'
import './index.css'

export default function EnterpriseDashboard() {
  const stats = {
    vehicleCount: 15,
    orderCount: 25,
    revenue: 1250,
    idleVehicles: 4,
    busyVehicles: 8,
    maintenanceVehicles: 3,
    todayOrders: 25,
    todayDistance: 280,
    todayRevenue: 1250,
  }

  const pendingTasks = [
    { id: 1, title: '3个待调度订单', urgent: true, action: '立即调度' },
    { id: 2, title: '1个车辆需要维护', urgent: false, action: '查看详情' },
    { id: 3, title: '2个外部订单待确认', urgent: true, action: '立即确认' },
  ]

  const recentOrders = [
    { id: 'ORD001', title: '仓库到门店配送', status: '进行中', progress: 60, time: '10:30' },
    { id: 'ORD002', title: '临时加急配送', status: '待调度', progress: 0, time: '11:00' },
    { id: 'ORD003', title: '批量家电配送', status: '已完成', progress: 100, time: '09:15' },
  ]

  const quickActions = [
    {
      id: 'publish',
      title: '发布需求',
      description: '创建新的配送需求',
      icon: Plus,
      color: '#52c41a',
      path: '/pages/enterprise/dispatch/publish',
    },
    {
      id: 'dispatch',
      title: '智能调度',
      description: '自动分配车辆',
      icon: Truck,
      color: '#1890ff',
      path: '/pages/enterprise/dispatch/list',
    },
    {
      id: 'external',
      title: '对外服务',
      description: '查看推荐订单',
      icon: ArrowUpRight,
      color: '#722ed1',
      path: '/pages/enterprise/external/orders',
    },
  ]

  const notifications = [
    { id: 1, title: '车辆A-002配送完成', time: '5分钟前', type: 'success' },
    { id: 2, title: '新订单ORD004待确认', time: '15分钟前', type: 'warning' },
    { id: 3, title: '车辆A-003维修完成', time: '1小时前', type: 'success' },
  ]

  const handleQuickAction = (action: typeof quickActions[0]) => {
    Taro.navigateTo({ url: action.path })
  }

  const handleTaskClick = (task: typeof pendingTasks[0]) => {
    if (task.action === '立即调度') {
      Taro.switchTab({ url: '/pages/enterprise/dispatch/list' })
    } else if (task.action === '立即确认') {
      Taro.switchTab({ url: '/pages/enterprise/external/orders' })
    } else {
      Taro.showToast({ title: '查看详情', icon: 'none' })
    }
  }

  const handleOrderClick = (order: typeof recentOrders[0]) => {
    Taro.showToast({ title: `订单${order.id}`, icon: 'none' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中':
        return '#1890ff'
      case '已完成':
        return '#52c41a'
      case '待调度':
        return '#faad14'
      default:
        return '#999'
    }
  }

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check size={16} color="#52c41a" />
      case 'warning':
        return <CircleAlert size={16} color="#faad14" />
      case 'info':
        return <Bell size={16} color="#1890ff" />
      default:
        return <Bell size={16} color="#999" />
    }
  }

  return (
    <View className="enterprise-dashboard">
      {/* 头部 */}
      <View className="header">
        <Text className="header-title">企业工作台</Text>
        <View className="header-actions">
          <Bell size={24} color="#1890ff" />
          <Badge variant="destructive" className="notification-badge">3</Badge>
        </View>
      </View>

      {/* 统计卡片 */}
      <View className="stats-container">
        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon" style={{ backgroundColor: '#e6f7ff' }}>
              <Truck size={32} color="#1890ff" />
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.vehicleCount}</Text>
              <Text className="stat-label">车辆总数</Text>
            </View>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon" style={{ backgroundColor: '#f6ffed' }}>
              <ClipboardList size={32} color="#52c41a" />
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.todayOrders}</Text>
              <Text className="stat-label">今日订单</Text>
            </View>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-content">
            <View className="stat-icon" style={{ backgroundColor: '#fff7e6' }}>
              <Text className="stat-icon-text">¥</Text>
            </View>
            <View className="stat-info">
              <Text className="stat-value">{stats.todayRevenue}</Text>
              <Text className="stat-label">今日收益</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷操作 */}
      <Card className="quick-actions-card">
        <CardHeader>
          <CardTitle className="card-title">快捷操作</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <View className="quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <View
                  key={action.id}
                  className="quick-action-item"
                  onClick={() => handleQuickAction(action)}
                >
                  <View className="action-icon" style={{ backgroundColor: `${action.color}20` }}>
                    <Icon size={24} color={action.color} />
                  </View>
                  <Text className="action-title">{action.title}</Text>
                  <Text className="action-description">{action.description}</Text>
                </View>
              )
            })}
          </View>
        </CardContent>
      </Card>

      {/* 车辆状态分布 */}
      <Card className="status-card">
        <CardHeader>
          <CardTitle className="card-title">车辆状态分布</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <View className="status-row">
            <View className="status-badge" style={{ backgroundColor: '#52c41a20', color: '#52c41a' }}>
              空闲
            </View>
            <Text className="status-text">{stats.idleVehicles}辆  {Math.round(stats.idleVehicles / stats.vehicleCount * 100)}%</Text>
            <View className="status-progress" style={{ width: `${stats.idleVehicles / stats.vehicleCount * 100}%`, backgroundColor: '#52c41a' }}></View>
          </View>
          <View className="status-row">
            <View className="status-badge" style={{ backgroundColor: '#1890ff20', color: '#1890ff' }}>
              执行中
            </View>
            <Text className="status-text">{stats.busyVehicles}辆  {Math.round(stats.busyVehicles / stats.vehicleCount * 100)}%</Text>
            <View className="status-progress" style={{ width: `${stats.busyVehicles / stats.vehicleCount * 100}%`, backgroundColor: '#1890ff' }}></View>
          </View>
          <View className="status-row">
            <View className="status-badge" style={{ backgroundColor: '#ff4d4f20', color: '#ff4d4f' }}>
              维修中
            </View>
            <Text className="status-text">{stats.maintenanceVehicles}辆  {Math.round(stats.maintenanceVehicles / stats.vehicleCount * 100)}%</Text>
            <View className="status-progress" style={{ width: `${stats.maintenanceVehicles / stats.vehicleCount * 100}%`, backgroundColor: '#ff4d4f' }}></View>
          </View>
        </CardContent>
      </Card>

      {/* 最近订单 */}
      <Card className="orders-card">
        <CardHeader>
          <View className="card-header-row">
            <CardTitle className="card-title">最近订单</CardTitle>
            <View className="card-header-action" onClick={() => Taro.switchTab({ url: '/pages/enterprise/dispatch/list' })}>
              <Text className="view-all-text">查看全部</Text>
              <ArrowRight size={16} color="#1890ff" />
            </View>
          </View>
        </CardHeader>
        <CardContent className="card-content">
          <View className="orders-list">
            {recentOrders.map((order) => (
              <View key={order.id} className="order-item" onClick={() => handleOrderClick(order)}>
                <View className="order-header">
                  <Text className="order-id">{order.id}</Text>
                  <View className="order-status" style={{ color: getStatusColor(order.status) }}>
                    {order.status === '进行中' && <Clock size={14} color="#1890ff" />}
                    {order.status === '已完成' && <Check size={14} color="#52c41a" />}
                    <Text className="order-status-text">{order.status}</Text>
                  </View>
                </View>
                <View className="order-info">
                  <Text className="order-title">{order.title}</Text>
                  <Text className="order-time">{order.time}</Text>
                </View>
                {order.status === '进行中' && (
                  <View className="order-progress">
                    <View className="progress-bar">
                      <View className="progress-fill" style={{ width: `${order.progress}%` }}></View>
                    </View>
                    <Text className="progress-text">{order.progress}%</Text>
                  </View>
                )}
              </View>
            ))}
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
            <View key={task.id} className="task-item" onClick={() => handleTaskClick(task)}>
              <View className="task-info">
                {task.urgent && <CircleAlert size={18} color="#ff4d4f" />}
                <Text className="task-title">{task.title}</Text>
              </View>
              <Text className="task-action">{task.action}</Text>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* 消息通知 */}
      <Card className="notifications-card">
        <CardHeader>
          <CardTitle className="card-title">消息通知</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <View className="notifications-list">
            {notifications.map((notification) => (
              <View key={notification.id} className="notification-item">
                <View className="notification-icon">{getStatusIcon(notification.type)}</View>
                <View className="notification-content">
                  <Text className="notification-title">{notification.title}</Text>
                  <Text className="notification-time">{notification.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* 今日数据统计 */}
      <Card className="today-stats-card">
        <CardHeader>
          <CardTitle className="card-title">今日数据</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <View className="today-stats-grid">
            <View className="today-stat-item">
              <Text className="today-stat-label">行驶里程</Text>
              <Text className="today-stat-value">{stats.todayDistance}km</Text>
            </View>
            <View className="today-stat-item">
              <Text className="today-stat-label">配送订单</Text>
              <Text className="today-stat-value">{stats.todayOrders}单</Text>
            </View>
            <View className="today-stat-item">
              <Text className="today-stat-label">订单金额</Text>
              <Text className="today-stat-value">¥{stats.todayRevenue}</Text>
            </View>
            <View className="today-stat-item">
              <Text className="today-stat-label">车辆利用率</Text>
              <Text className="today-stat-value">{Math.round(stats.busyVehicles / stats.vehicleCount * 100)}%</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
