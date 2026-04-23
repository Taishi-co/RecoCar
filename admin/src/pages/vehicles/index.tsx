import { useEffect, useState } from 'react'
import { Table, Card, Select, Tag, Space, Button, Modal, Form, Input, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getVehicles, reviewVehicle } from '@/api/vehicles'

const { Option } = Select
const { TextArea } = Input

const Vehicles = () => {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: '',
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewForm] = Form.useForm()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

  useEffect(() => {
    loadVehicles()
  }, [pagination.current, pagination.pageSize, filters])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res = await getVehicles({
        status: filters.status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      setVehicles(res.list)
      setPagination({ ...pagination, total: res.total })
    } catch (error) {
      console.error('加载车辆列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (record: any) => {
    setSelectedVehicle(record)
    setReviewModalVisible(true)
    reviewForm.resetFields()
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      await reviewVehicle(selectedVehicle.id, {
        status: values.status,
        remarks: values.remarks,
      })
      message.success('审核成功')
      setReviewModalVisible(false)
      loadVehicles()
    } catch (error) {
      console.error('审核失败:', error)
    }
  }

  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '车主昵称',
      dataIndex: 'owner_nickname',
      key: 'owner_nickname',
    },
    {
      title: '车型',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
    },
    {
      title: '车牌号',
      dataIndex: 'license_plate',
      key: 'license_plate',
    },
    {
      title: '载重(kg)',
      dataIndex: 'load_capacity',
      key: 'load_capacity',
    },
    {
      title: '容积(m³)',
      dataIndex: 'volume',
      key: 'volume',
    },
    {
      title: '冷链能力',
      dataIndex: 'has_cold_chain',
      key: 'has_cold_chain',
      render: (has: boolean) => (has ? <Tag color="cyan">有</Tag> : <Tag>无</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: any = {
          pending: 'orange',
          active: 'green',
          rejected: 'red',
        }
        const textMap: any = {
          pending: '待审核',
          active: '已通过',
          rejected: '已拒绝',
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
        </Space>
      ),
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
            <Option value="pending">待审核</Option>
            <Option value="active">已通过</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
          <Button onClick={() => setFilters({ status: '' })}>重置</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={vehicles}
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

      <Modal
        title="车辆审核"
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            label="审核结果"
            name="status"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value="active">通过</Option>
              <Option value="rejected">拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <TextArea rows={4} placeholder="请输入审核备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Vehicles
