import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

interface LoginForm {
  username: string
  password: string
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setToken, setAdminInfo } = useAuthStore()

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const res = await login(values)
      setToken(res.token)
      setAdminInfo(res.admin)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card
        title="无人车共享运营平台 - 管理后台"
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: 18 }}
      >
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          默认账号: admin / 密码: admin123
        </div>
      </Card>
    </div>
  )
}

export default Login
