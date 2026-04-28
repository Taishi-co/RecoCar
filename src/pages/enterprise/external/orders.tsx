import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, MapPin, DollarSign, Clock } from 'lucide-react-taro'
import './orders.css'

export default function ExternalOrders() {
  const vehicles = [
    {
      id: 'A-001',
      status: '空闲-对外',
      location: '路北区XX路',
      todayRevenue: 150,
    },
    {
      id: 'A-002',
      status: '配送中',
      currentOrder: 'EXT20260427001',
      progress: 50,
      expectedTime: '11:30',
    },
  ]

  const recommendedOrders = [
    {
      id: 1,
      title: '空调（A→B）',
      distance: '2.3km',
      price: 50,
    },
    {
      id: 2,
      title: '纸箱（C→D）',
      distance: '3.1km',
      price: 45,
    },
    {
      id: 3,
      title: '家具（E→F）',
      distance: '4.5km',
      price: 60,
    },
  ]

  return (
    <View className="external-orders">
      {/* 头部 */}
      <View className="header">
        <Globe size={24} color="#1890ff" />
        <Text className="header-title">对外服务</Text>
      </View>

      {/* 车辆列表 */}
      <View className="vehicles-section">
        <Text className="section-title">车辆状态</Text>
        <View className="vehicles-container">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="vehicle-card">
              <CardContent className="vehicle-content">
                <View className="vehicle-header">
                  <Text className="vehicle-name">车辆{vehicle.id}</Text>
                  <Badge variant={vehicle.status === '配送中' ? 'default' : 'secondary'} className="status-badge">
                    {vehicle.status}
                  </Badge>
                </View>

                {vehicle.status === '空闲-对外' ? (
                  <View className="vehicle-details">
                    <View className="detail-row">
                      <MapPin size={16} color="#6b7280" />
                      <Text className="detail-text">{vehicle.location}</Text>
                    </View>
                    <View className="detail-row">
                      <DollarSign size={16} color="#6b7280" />
                      <Text className="detail-text">今日收益：¥{vehicle.todayRevenue}</Text>
                    </View>
                  </View>
                ) : (
                  <View className="vehicle-details">
                    <View className="detail-row">
                      <Text className="detail-label">当前订单：</Text>
                      <Text className="detail-value">{vehicle.currentOrder}</Text>
                    </View>
                    <View className="detail-row">
                      <Text className="detail-label">进度：</Text>
                      <Text className="detail-value">{vehicle.progress}%</Text>
                    </View>
                    <View className="detail-row">
                      <Clock size={16} color="#6b7280" />
                      <Text className="detail-text">预计{vehicle.expectedTime}完成</Text>
                    </View>
                  </View>
                )}

                {vehicle.status === '空闲-对外' && recommendedOrders.length > 0 && (
                  <View className="recommended-orders">
                    <Text className="recommended-title">推荐订单：</Text>
                    {recommendedOrders.map((order) => (
                      <View key={order.id} className="order-item">
                        <View className="order-info">
                          <Text className="order-title">{order.title}</Text>
                          <Text className="order-meta">{order.distance}  ¥{order.price}</Text>
                        </View>
                        <Text className="order-action">接单</Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
          ))}
        </View>
      </View>
    </View>
  )
}
