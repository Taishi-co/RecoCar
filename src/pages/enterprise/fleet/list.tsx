import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus } from 'lucide-react-taro'
import './list.css'

export default function FleetList() {
  const vehicles = [
    {
      id: 'A-001',
      plate: '冀B·12345',
      type: '中型车',
      capacity: '1.5吨',
      volume: '3m³',
      status: '对外服务',
      driver: '张师傅',
      location: '路北区XX路',
      todayOrders: 2,
      todayRevenue: 150,
    },
    {
      id: 'A-002',
      plate: '冀B·67890',
      type: '中型车',
      capacity: '1.5吨',
      volume: '3m³',
      status: '配送中',
      driver: '李师傅',
      location: '配送中...',
      todayOrders: 3,
      todayRevenue: 220,
    },
    {
      id: 'A-003',
      plate: '冀B·11111',
      type: '大型车',
      capacity: '3.5吨',
      volume: '6m³',
      status: '内部',
      driver: '王师傅',
      location: '仓库A',
      todayOrders: 1,
      todayRevenue: 80,
    },
  ]

  return (
    <View className="fleet-list">
      {/* 头部操作栏 */}
      <View className="header-actions">
        <View className="header-title">
          <Truck size={24} color="#1890ff" />
          <Text className="title-text">车队管理</Text>
        </View>
        <Button className="add-button" size="sm">
          <Plus size={16} color="#ffffff" />
          <Text>添加车辆</Text>
        </Button>
      </View>

      {/* 车辆列表 */}
      <View className="vehicles-container">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="vehicle-card">
            <CardContent className="vehicle-content">
              {/* 车辆头部 */}
              <View className="vehicle-header">
                <View className="vehicle-info">
                  <Text className="vehicle-name">车辆{vehicle.id}</Text>
                  <Text className="vehicle-type">{vehicle.type}</Text>
                </View>
                <Badge variant={vehicle.status === '配送中' ? 'default' : 'secondary'} className="status-badge">
                  {vehicle.status}
                </Badge>
              </View>

              {/* 车辆详情 */}
              <View className="vehicle-details">
                <View className="detail-row">
                  <Text className="detail-label">车牌号</Text>
                  <Text className="detail-value">{vehicle.plate}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">载重</Text>
                  <Text className="detail-value">{vehicle.capacity}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">容积</Text>
                  <Text className="detail-value">{vehicle.volume}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">司机</Text>
                  <Text className="detail-value">{vehicle.driver}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">位置</Text>
                  <Text className="detail-value">{vehicle.location}</Text>
                </View>
              </View>

              {/* 今日统计 */}
              <View className="vehicle-stats">
                <View className="stat-item">
                  <Text className="stat-label">今日订单</Text>
                  <Text className="stat-value">{vehicle.todayOrders}单</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-label">今日收益</Text>
                  <Text className="stat-value">¥{vehicle.todayRevenue}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  )
}
