import { useEffect, useState } from 'react'
import { Table, Card, Select, Tag, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getOrders } from '@/api/orders'

const { Option } = Select

const Orders = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: '',
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadOrders()
  }, [pagination.current, pagination.pageSize, filters])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await getOrders({
        status: filters.status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      setOrders(res.list)
      setPagination({ ...pagination, total: res.total })
    } catch (error) {
      console.error('加载订单列表失败:', error)
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

  const columns: ColumnsType<any> = [
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
      title: '车辆ID',
      dataIndex: 'vehicle_id',
      key: 'vehicle_id',
      width: 150,
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
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
            value={filters.status || undefined}
          >
            <Option value="pending">待接单</Option>
            <Option value="accepted">已接单</Option>
            <Option value="in_transit">运输中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Button onClick={() => setFilters({ status: '' })}>重置</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize })
            },
          }}
        />
      </Card>
    </div>
  )
}

export default Orders
