import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import Login from '@/pages/login'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/dashboard'),
      },
      {
        path: 'users',
        lazy: () => import('@/pages/users'),
      },
      {
        path: 'vehicles',
        lazy: () => import('@/pages/vehicles'),
      },
      {
        path: 'orders',
        lazy: () => import('@/pages/orders'),
      },
      {
        path: 'statistics',
        lazy: () => import('@/pages/statistics'),
      },
    ],
  },
])

export default router
