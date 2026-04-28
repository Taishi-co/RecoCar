import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Plus, Package, Clock } from 'lucide-react-taro'
import './index.css'

export default function DispatchList() {
  const stats = {
    pending: 3,
    inProgress: 2,
    completed: 20,
  }

  const orders = [
    {
      id: 1,
      title: '今日仓库到门店配送',
      priority: '普通',
      publishTime: '10:00',
      deliveryPoints: 15,
      totalWeight: 1800,
      expectedTime: '9:00-12:00',
      suggested: '2辆车 24km',
    },
    {
      id: 2,
      title: '紧急临时配送',
      priority: '紧急',
      publishTime: '11:30',
      deliveryPoints: 3,
      totalWeight: 650,
      expectedTime: '12:00-14:00',
      suggested: '1辆车 8km',
    },
    {
      id: 3,
      title: '批量家电配送',
      priority: '特急',
      publishTime: '14:00',
      deliveryPoints: 8,
      totalWeight: 2200,
      expectedTime: '15:00-17:00',
      suggested: '3辆车 28km',
    },
  ]

  return (
    <View className="dispatch-list">
      {/* 头部操作栏 */}
      <View className="header-actions">
        <View className="header-title">
          <ClipboardList size={24} color="#1890ff" />
          <Text className="title-text">调度中心</Text>
        </View>
        <Button className="add-button" size="sm">
          <Plus size={16} color="#ffffff" />
          <Text>发布需求</Text>
        </Button>
      </View>

      {/* 标签页 */}
      <View className="tabs">
        <View className="tab tab-active">
          <Text className="tab-text">待调度 ({stats.pending})</Text>
        </View>
        <View className="tab">
          <Text className="tab-text">进行中 ({stats.inProgress})</Text>
        </View>
        <View className="tab">
          <Text className="tab-text">已完成 ({stats.completed})</Text>
        </View>
      </View>

      {/* 订单列表 */}
      <View className="orders-container">
        {orders.map((order) => (
          <Card key={order.id} className="order-card">
            <CardContent className="order-content">
              {/* 订单头部 */}
              <View className="order-header">
                <View className="order-info">
                  <Text className="order-title">{order.title}</Text>
                  <View className="order-meta">
                    <Clock size={14} color="#6b7280" />
                    <Text className="meta-text">{order.publishTime}发布</Text>
                  </View>
                </View>
                <Badge
                  variant={order.priority === '紧急' || order.priority === '特急' ? 'destructive' : 'default'}
                  className="priority-badge"
                >
                  {order.priority}
                </Badge>
              </View>

              {/* 订单详情 */}
              <View className="order-details">
                <View className="detail-item">
                  <Package size={16} color="#6b7280" />
                  <Text className="detail-text">{order.deliveryPoints}个送货点</Text>
                </View>
                <View className="detail-item">
                  <Text className="detail-label">总重量：</Text>
                  <Text className="detail-value">{order.totalWeight}kg</Text>
                </View>
                <View className="detail-item">
                  <Text className="detail-label">期望时间：</Text>
                  <Text className="detail-value">{order.expectedTime}</Text>
                </View>
              </View>

              {/* 系统建议 */}
              <View className="suggestion">
                <Text className="suggestion-label">系统建议：</Text>
                <Text className="suggestion-value">{order.suggested}</Text>
              </View>

              {/* 操作按钮 */}
              <View className="order-actions">
                <Button variant="outline" className="action-button">
                  <Text>查看详情</Text>
                </Button>
                <Button className="action-button primary">
                  <Text>开始调度</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  )
}
