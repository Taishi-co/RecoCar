import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { Truck, Package, Check, Clock, Shield } from 'lucide-react-taro'

interface Statistics {
  orders: {
    total: number
    completed: number
    in_transit: number
  }
  vehicles: {
    total: number
    active: number
  }
  demands: {
    total: number
    pending: number
  }
  recentOrders: Array<{
    id: string
    cargoName: string
    ownerName: string
    farePrice: number
    completeTime: string
  }>
}

export default function Index() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)

  // 登录/注册弹窗
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'owner' | 'merchant'>('owner')
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const res = await Network.request({
        url: '/api/home/statistics',
        method: 'GET'
      })

      console.log('统计数据响应:', res.data)

      if (res.data.code === 200) {
        setStatistics(res.data.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleRoleSelect = (selectedRole: 'owner' | 'merchant') => {
    setRole(selectedRole)
    if (mode === 'register') {
      setStep('form')
    } else {
      setStep('form')
    }
  }

  const handleSubmit = async () => {
    if (!phone || !password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (mode === 'register' && !name) {
      Taro.showToast({
        title: '请填写姓名',
        icon: 'none'
      })
      return
    }

    setAuthLoading(true)

    try {
      if (mode === 'login') {
        const res = await Network.request({
          url: '/api/auth/login',
          method: 'POST',
          data: { phone, password }
        })

        if (res.data.code === 200) {
          Taro.setStorageSync('userInfo', res.data.data)
          Taro.setStorageSync('token', res.data.data.token)

          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })

          setTimeout(() => {
            const userRole = res.data.data.role
            switchTabByRole(userRole)
          }, 1500)
        } else {
          Taro.showToast({
            title: res.data.message || '登录失败',
            icon: 'none'
          })
        }
      } else {
        const res = await Network.request({
          url: '/api/auth/register',
          method: 'POST',
          data: { phone, password, name, role }
        })

        if (res.data.code === 200) {
          Taro.showToast({
            title: '注册成功',
            icon: 'success'
          })

          setTimeout(() => {
            const userRole = res.data.data.role
            switchTabByRole(userRole)
          }, 1500)
        } else {
          Taro.showToast({
            title: res.data.message || '注册失败',
            icon: 'none'
          })
        }
      }
    } catch (error) {
      console.error('请求失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setAuthLoading(false)
    }
  }

  const switchTabByRole = (userRole: string) => {
    setShowAuthDialog(false)
    if (userRole === 'owner') {
      Taro.redirectTo({ url: '/pages/owner/demands/index' })
    } else if (userRole === 'merchant') {
      Taro.redirectTo({ url: '/pages/merchant/demands/index' })
    } else if (userRole === 'admin') {
      Taro.redirectTo({ url: '/pages/admin/users/index' })
    }
  }

  const openAuthDialog = (authMode: 'login' | 'register') => {
    setMode(authMode)
    setStep('role')
    setShowAuthDialog(true)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-full">
        {/* 头部 */}
        <View className="bg-gradient-to-br from-blue-500 to-blue-600 pt-12 pb-8 px-4">
          <Text className="block text-2xl font-bold text-white text-center">
            无人车共享运营平台
          </Text>
          <Text className="block text-sm text-blue-100 text-center mt-2">
            高效运力撮合 · 便捷服务
          </Text>
        </View>

        {/* 数据统计卡片 */}
        <View className="px-4 -mt-4">
          <Card className="bg-white rounded-lg shadow-md mb-4">
            <CardContent className="p-4">
              <View className="flex justify-between items-center">
                <View className="text-center flex-1">
                  <Text className="block text-2xl font-bold text-blue-500">
                    {statistics?.orders.total || 0}
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">总订单数</Text>
                </View>
                <View className="text-center flex-1">
                  <Text className="block text-2xl font-bold text-green-500">
                    {statistics?.vehicles.total || 0}
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">车辆数</Text>
                </View>
                <View className="text-center flex-1">
                  <Text className="block text-2xl font-bold text-orange-500">
                    {statistics?.demands.total || 0}
                  </Text>
                  <Text className="block text-xs text-gray-500 mt-1">需求数</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* 平台特色 */}
        <View className="px-4 mb-6">
          <Text className="block text-lg font-semibold text-gray-800 mb-3">
            平台特色
          </Text>
          <View className="grid grid-cols-2 gap-3">
            <Card className="bg-white rounded-lg shadow-sm p-4">
              <View className="flex items-center mb-2">
                <Clock size={20} color="#3b82f6" />
                <Text className="block text-sm font-semibold text-gray-700 ml-2">
                  快速匹配
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                智能算法快速匹配车辆
              </Text>
            </Card>
            <Card className="bg-white rounded-lg shadow-sm p-4">
              <View className="flex items-center mb-2">
                <Shield size={20} color="#10b981" />
                <Text className="block text-sm font-semibold text-gray-700 ml-2">
                  安全保障
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                全程追踪，安全可靠
              </Text>
            </Card>
            <Card className="bg-white rounded-lg shadow-sm p-4">
              <View className="flex items-center mb-2">
                <Truck size={20} color="#f59e0b" />
                <Text className="block text-sm font-semibold text-gray-700 ml-2">
                  运力充足
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                多种车型，满足需求
              </Text>
            </Card>
            <Card className="bg-white rounded-lg shadow-sm p-4">
              <View className="flex items-center mb-2">
                <Package size={20} color="#8b5cf6" />
                <Text className="block text-sm font-semibold text-gray-700 ml-2">
                便捷下单
                </Text>
              </View>
              <Text className="block text-xs text-gray-500">
                简单几步，轻松完成
              </Text>
            </Card>
          </View>
        </View>

        {/* 角色介绍 */}
        <View className="px-4 mb-6">
          <Text className="block text-lg font-semibold text-gray-800 mb-3">
            选择您的角色
          </Text>
          <View className="space-y-3">
            <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
              <CardHeader>
                <View className="flex items-center justify-between">
                  <View className="flex items-center">
                    <Truck size={24} color="#3b82f6" />
                    <View className="ml-3">
                      <Text className="block text-base font-semibold text-gray-800">
                        运力方（车主）
                      </Text>
                      <Text className="block text-xs text-gray-500 mt-1">
                        注册车辆、接单赚钱、查看收益
                      </Text>
                    </View>
                  </View>
                </View>
              </CardHeader>
            </Card>

            <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
              <CardHeader>
                <View className="flex items-center justify-between">
                  <View className="flex items-center">
                    <Package size={24} color="#10b981" />
                    <View className="ml-3">
                      <Text className="block text-base font-semibold text-gray-800">
                        需求方
                      </Text>
                      <Text className="block text-xs text-gray-500 mt-1">
                        发布需求、快捷下单、追踪运输
                      </Text>
                    </View>
                  </View>
                </View>
              </CardHeader>
            </Card>
          </View>
        </View>

        {/* 最近完成的订单 */}
        {statistics?.recentOrders && statistics.recentOrders.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex items-center justify-between mb-3">
              <Text className="block text-lg font-semibold text-gray-800">
                最近完成订单
              </Text>
              <Text className="block text-xs text-gray-500">
                共 {statistics.recentOrders.length} 条
              </Text>
            </View>
            <View className="space-y-3">
              {statistics.recentOrders.map((order) => (
                <Card key={order.id} className="bg-white rounded-lg shadow-sm p-4">
                  <View className="flex justify-between items-start">
                    <View className="flex-1">
                      <Text className="block text-sm font-semibold text-gray-800 mb-1">
                        {order.cargoName}
                      </Text>
                      <Text className="block text-xs text-gray-500 mb-2">
                        车主：{order.ownerName}
                      </Text>
                      <Text className="block text-xs text-gray-400">
                        {order.completeTime}
                      </Text>
                    </View>
                    <View className="text-right">
                      <Text className="block text-base font-bold text-green-500">
                        ¥{order.farePrice}
                      </Text>
                      <View className="flex items-center justify-end mt-1">
                        <Check size={14} color="#10b981" />
                        <Text className="text-xs text-green-500 ml-1">已完成</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 底部操作按钮 */}
        <View className="px-4 py-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <CardContent className="p-6">
              <Text className="block text-lg font-bold text-white text-center mb-4">
                立即开始使用
              </Text>
              <View className="space-y-3">
                <Button
                  className="w-full bg-white text-blue-500 hover:bg-gray-100"
                  onClick={() => openAuthDialog('register')}
                >
                  <Text className="text-base font-semibold">立即注册</Text>
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent text-white border-white hover:bg-white hover:bg-opacity-10"
                  onClick={() => openAuthDialog('login')}
                >
                  <Text className="text-base">已有账号？登录</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 登录/注册弹窗 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-center">
              {mode === 'login' ? '登录' : '注册'}
            </DialogTitle>
          </DialogHeader>

          <View className="flex justify-center gap-4 mb-4">
            <Button
              variant={mode === 'login' ? 'default' : 'outline'}
              onClick={() => {
                setMode('login')
                setStep('role')
              }}
              className={mode === 'login' ? 'bg-blue-500' : ''}
              size="sm"
            >
              <Text className="text-sm">登录</Text>
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'outline'}
              onClick={() => {
                setMode('register')
                setStep('role')
              }}
              className={mode === 'register' ? 'bg-blue-500' : ''}
              size="sm"
            >
              <Text className="text-sm">注册</Text>
            </Button>
          </View>

          {step === 'role' && mode === 'register' ? (
            <View>
              <Text className="block text-sm font-semibold text-center mb-4">
                选择您的角色
              </Text>
              <View className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-16"
                  onClick={() => handleRoleSelect('owner')}
                >
                  <View className="text-center">
                    <Text className="block text-base font-semibold">运力方（车主）</Text>
                    <Text className="block text-xs text-gray-500 mt-1">注册车辆、接单、查看收益</Text>
                  </View>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-16"
                  onClick={() => handleRoleSelect('merchant')}
                >
                  <View className="text-center">
                    <Text className="block text-base font-semibold">需求方</Text>
                    <Text className="block text-xs text-gray-500 mt-1">发布需求、下单、追踪订单</Text>
                  </View>
                </Button>
              </View>
            </View>
          ) : (
            <View>
              {mode === 'register' && (
                <View className="mb-4">
                  <Label className="block text-sm font-medium mb-2">
                    <Text className="text-red-500">*</Text>姓名
                  </Label>
                  <Input
                    className="w-full bg-gray-50"
                    placeholder="请输入您的姓名"
                    value={name}
                    onInput={(e) => setName(e.detail.value)}
                  />
                </View>
              )}

              <View className="mb-4">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>手机号
                </Label>
                <Input
                  className="w-full bg-gray-50"
                  placeholder="请输入手机号"
                  type="number"
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                />
              </View>

              <View className="mb-4">
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>密码
                </Label>
                <Input
                  className="w-full bg-gray-50"
                  placeholder="请输入密码"
                  password
                  value={password}
                  onInput={(e) => setPassword(e.detail.value)}
                />
              </View>

              <Button
                className="w-full bg-blue-500"
                onClick={handleSubmit}
                disabled={authLoading}
              >
                <Text className="text-sm">
                  {authLoading
                    ? mode === 'login'
                      ? '登录中...'
                      : '注册中...'
                    : mode === 'login'
                    ? '登录'
                    : '注册'}
                </Text>
              </Button>
            </View>
          )}
        </DialogContent>
      </Dialog>
    </View>
  )
}
