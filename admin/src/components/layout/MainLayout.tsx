import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, message } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: '/vehicles',
    icon: <CarOutlined />,
    label: '车辆管理',
  },
  {
    key: '/orders',
    icon: <ShoppingOutlined />,
    label: '订单管理',
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '数据统计',
  },
]

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { adminInfo, logout } = useAuthStore()

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    message.success('退出登录成功')
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529', color: '#fff' }}>
          {collapsed ? 'WRC' : 'WRC Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>管理后台</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{adminInfo?.username || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
