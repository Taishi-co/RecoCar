import { useEffect, useState } from 'react'
import { Table, Card, Select, Tag, Space, Button, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getUsers, updateUserStatus } from '@/api/users'

const { Option } = Select

const Users = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadUsers()
  }, [pagination.current, pagination.pageSize, filters])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await getUsers({
        role: filters.role || undefined,
        status: filters.status || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      setUsers(res.list)
      setPagination({ ...pagination, total: res.total })
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateUserStatus(id, status)
      message.success('状态更新成功')
      loadUsers()
    } catch (error) {
      console.error('更新状态失败:', error)
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
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'merchant' ? 'blue' : 'green'}>
          {role === 'merchant' ? '需求方' : '车主'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Select
          value={status}
          style={{ width: 100 }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="active">正常</Option>
          <Option value="disabled">禁用</Option>
        </Select>
      ),
    },
    {
      title: '注册时间',
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
            placeholder="选择角色"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, role: value || '' })}
            value={filters.role || undefined}
          >
            <Option value="merchant">需求方</Option>
            <Option value="owner">车主</Option>
          </Select>
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
            value={filters.status || undefined}
          >
            <Option value="active">正常</Option>
            <Option value="disabled">禁用</Option>
          </Select>
          <Button onClick={() => setFilters({ role: '', status: '' })}>重置</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={users}
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

export default Users
