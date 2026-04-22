import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './index.css'

export default function Index() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'owner' | 'merchant'>('owner')
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = (selectedRole: 'owner' | 'merchant') => {
    setRole(selectedRole)
    if (mode === 'register') {
      setStep('form')
    } else {
      // 登录模式，直接进入表单
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

    setLoading(true)

    try {
      if (mode === 'login') {
        // 登录逻辑
        const res = await Network.request({
          url: '/auth/login',
          method: 'POST',
          data: { phone, password }
        })

        console.log('登录响应:', res.data)

        if (res.data.code === 200) {
          // 保存用户信息和 token
          Taro.setStorageSync('userInfo', res.data.data)
          Taro.setStorageSync('token', res.data.data.token)

          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 根据角色跳转到对应首页
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
        // 注册逻辑
        const res = await Network.request({
          url: '/auth/register',
          method: 'POST',
          data: { phone, password, name, role }
        })

        console.log('注册响应:', res.data)

        if (res.data.code === 200) {
          Taro.showToast({
            title: '注册成功',
            icon: 'success'
          })

          // 自动登录并跳转
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
      setLoading(false)
    }
  }

  const switchTabByRole = (userRole: string) => {
    if (userRole === 'owner') {
      Taro.switchTab({ url: '/pages/owner/vehicles/index' })
    } else if (userRole === 'merchant') {
      Taro.switchTab({ url: '/pages/merchant/demands/index' })
    } else if (userRole === 'admin') {
      Taro.switchTab({ url: '/pages/admin/users/index' })
    }
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <View className="bg-blue-500 pt-12 pb-8 px-4">
        <Text className="block text-2xl font-bold text-white text-center">
          无人车共享运营平台
        </Text>
        <Text className="block text-sm text-blue-100 text-center mt-2">
          高效运力撮合 · 便捷服务
        </Text>
      </View>

      {/* 内容区域 */}
      <View className="px-4 -mt-4">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <View className="flex justify-center gap-4">
              <Button
                variant={mode === 'login' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('login')
                  setStep('role')
                }}
                className={mode === 'login' ? 'bg-blue-500' : ''}
              >
                <Text>登录</Text>
              </Button>
              <Button
                variant={mode === 'register' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('register')
                  setStep('role')
                }}
                className={mode === 'register' ? 'bg-blue-500' : ''}
              >
                <Text>注册</Text>
              </Button>
            </View>
          </CardHeader>

          <CardContent>
            {step === 'role' && mode === 'register' ? (
              // 角色选择
              <View>
                <Text className="block text-lg font-semibold text-center mb-4">
                  选择您的角色
                </Text>
                <View className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-20"
                    onClick={() => handleRoleSelect('owner')}
                  >
                    <View className="text-center">
                      <Text className="block text-lg font-semibold">运力方（车主）</Text>
                      <Text className="block text-xs text-gray-500 mt-1">注册车辆、接单、查看收益</Text>
                    </View>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-20"
                    onClick={() => handleRoleSelect('merchant')}
                  >
                    <View className="text-center">
                      <Text className="block text-lg font-semibold">需求方</Text>
                      <Text className="block text-xs text-gray-500 mt-1">发布需求、下单、追踪订单</Text>
                    </View>
                  </Button>
                </View>
              </View>
            ) : (
              // 登录/注册表单
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

                <View className="mb-6">
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
                  disabled={loading}
                >
                  <Text>{loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登录' : '注册')}</Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
