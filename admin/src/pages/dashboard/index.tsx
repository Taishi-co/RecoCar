import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { UserOutlined, CarOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons'
import { getStatistics } from '@/api/statistics'

const Dashboard = () => {
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

  const getStatusColor = (status: string) => {
    const colorMap: any = {
      pending: 'orange',
      accepted: 'blue',
      in_transit: 'purple',
      completed: 'green',
      cancelled: 'red',
    }
    return colorMap[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const textMap: any = {
      pending: '待接单',
      accepted: '已接单',
      in_transit: '运输中',
      completed: '已完成',
      cancelled: '已取消',
    }
    return textMap[status] || status
  }

  const recentOrdersColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '需求方',
      dataIndex: 'merchant_nickname',
      key: 'merchant_nickname',
    },
    {
      title: '车主',
      dataIndex: 'owner_nickname',
      key: 'owner_nickname',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats?.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总车辆数"
              value={stats?.total_vehicles || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats?.total_orders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总收入"
              value={stats?.total_revenue || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="用户分布" loading={loading}>
            {stats && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ marginRight: 8 }}>需求方：</span>
                  <Tag color="blue">{stats.users_by_role.merchant} 人</Tag>
                </div>
                <div>
                  <span style={{ marginRight: 8 }}>车主：</span>
                  <Tag color="green">{stats.users_by_role.owner} 人</Tag>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="订单状态分布" loading={loading}>
            {stats && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>待接单：</span>
                  <Tag color="orange">{stats.orders_by_status.pending}</Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>已接单：</span>
                  <Tag color="blue">{stats.orders_by_status.accepted}</Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>运输中：</span>
                  <Tag color="purple">{stats.orders_by_status.in_transit}</Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>已完成：</span>
                  <Tag color="green">{stats.orders_by_status.completed}</Tag>
                </div>
                <div>
                  <span style={{ marginRight: 8 }}>已取消：</span>
                  <Tag color="red">{stats.orders_by_status.cancelled}</Tag>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" style={{ marginTop: 16 }} loading={loading}>
        <Table
          dataSource={stats?.recent_orders || []}
          columns={recentOrdersColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard
