import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Progress } from 'antd'
import { getStatistics } from '@/api/statistics'

const Statistics = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await getStatistics()
      setStats(res)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalOrders = stats?.orders_by_status?.pending + stats?.orders_by_status?.accepted +
                      stats?.orders_by_status?.in_transit + stats?.orders_by_status?.completed +
                      stats?.orders_by_status?.cancelled || 1

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="总用户数" value={stats?.total_users || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="总车辆数" value={stats?.total_vehicles || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="总订单数" value={stats?.total_orders || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="总收入" value={stats?.total_revenue || 0} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="用户分布" loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>需求方</div>
                  <Statistic
                    value={stats?.users_by_role?.merchant || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>车主</div>
                  <Statistic
                    value={stats?.users_by_role?.owner || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="订单完成率" loading={loading}>
            <Progress
              type="circle"
              percent={Math.round(((stats?.orders_by_status?.completed || 0) / totalOrders) * 100)}
              format={(percent) => `${percent}%`}
            />
          </Card>
        </Col>
      </Row>

      <Card title="订单状态统计" style={{ marginTop: 16 }} loading={loading}>
        <Row gutter={16}>
          <Col span={24 / 5}>
            <Card size="small">
              <Statistic
                title="待接单"
                value={stats?.orders_by_status?.pending || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={24 / 5}>
            <Card size="small">
              <Statistic
                title="已接单"
                value={stats?.orders_by_status?.accepted || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={24 / 5}>
            <Card size="small">
              <Statistic
                title="运输中"
                value={stats?.orders_by_status?.in_transit || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={24 / 5}>
            <Card size="small">
              <Statistic
                title="已完成"
                value={stats?.orders_by_status?.completed || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={24 / 5}>
            <Card size="small">
              <Statistic
                title="已取消"
                value={stats?.orders_by_status?.cancelled || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Statistics
