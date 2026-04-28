import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './index.css'

interface Station {
  id: string
  name: string
  address: string
  phone?: string
  location?: { lat: number; lng: number }
  status: string
  created_at: string
}

const EnterpriseStationsPage: FC = () => {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [enterpriseId, setEnterpriseId] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  })

  useEffect(() => {
    loadEnterpriseInfo()
  }, [])

  const loadEnterpriseInfo = async () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo) {
        Taro.redirectTo({ url: '/pages/index/index' })
        return
      }

      const enterpriseRes = await Network.request({
        url: `/api/enterprise/admin/${userInfo.id}`,
      })

      if (enterpriseRes.data.code === 200) {
        const entId = enterpriseRes.data.data.id
        setEnterpriseId(entId)
        loadStations(entId)
      }
    } catch (error) {
      console.error('加载企业信息失败:', error)
    }
  }

  const loadStations = async (entId: string) => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/station',
        data: { enterpriseId: entId },
      })

      console.log('奶站列表响应:', res.data)

      if (res.data.code === 200) {
        setStations(res.data.data.list || [])
      }
    } catch (error) {
      console.error('加载奶站列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStation = async () => {
    if (!formData.name || !formData.address) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none',
      })
      return
    }

    try {
      const res = await Network.request({
        url: '/api/station',
        method: 'POST',
        data: {
          enterpriseId,
          name: formData.name,
          address: formData.address,
          phone: formData.phone || undefined,
        },
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: '添加成功',
          icon: 'success',
        })
        setShowAddDialog(false)
        setFormData({ name: '', address: '', phone: '' })
        loadStations(enterpriseId)
      } else {
        Taro.showToast({
          title: res.data.message || '添加失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('添加失败:', error)
      Taro.showToast({
        title: '添加失败',
        icon: 'none',
      })
    }
  }

  const handleEditStation = async () => {
    if (!editingStation || !formData.name || !formData.address) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none',
      })
      return
    }

    try {
      const res = await Network.request({
        url: `/api/station/${editingStation.id}`,
        method: 'PUT',
        data: {
          name: formData.name,
          address: formData.address,
          phone: formData.phone || undefined,
        },
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: '更新成功',
          icon: 'success',
        })
        setShowEditDialog(false)
        setEditingStation(null)
        setFormData({ name: '', address: '', phone: '' })
        loadStations(enterpriseId)
      } else {
        Taro.showToast({
          title: res.data.message || '更新失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('更新失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none',
      })
    }
  }

  const handleDeleteStation = async (stationId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个奶站吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const delRes = await Network.request({
              url: `/api/station/${stationId}`,
              method: 'DELETE',
            })

            if (delRes.data.code === 200) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
              })
              loadStations(enterpriseId)
            } else {
              Taro.showToast({
                title: delRes.data.message || '删除失败',
                icon: 'none',
              })
            }
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({
              title: '删除失败',
              icon: 'none',
            })
          }
        }
      },
    })
  }

  const openEditDialog = (station: Station) => {
    setEditingStation(station)
    setFormData({
      name: station.name,
      address: station.address,
      phone: station.phone || '',
    })
    setShowEditDialog(true)
  }

  return (
    <View className="enterprise-stations min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-full">
        <View className="p-4">
          {/* 顶部操作栏 */}
          <View className="flex justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              奶站管理
            </Text>
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Text className="text-white">添加奶站</Text>
            </Button>
          </View>

          {/* 奶站列表 */}
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-gray-500">加载中...</Text>
            </View>
          ) : stations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Text className="text-gray-500 text-sm block">暂无奶站</Text>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Text className="text-white">添加第一个奶站</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            stations.map((station) => (
              <Card key={station.id} className="mb-3">
                <CardHeader>
                  <View className="flex justify-between items-start">
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    <Text className="text-xs px-2 py-1 rounded bg-green-100 text-green-600">
                      {station.status === 'active' ? '正常' : '停用'}
                    </Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="text-sm text-gray-600 mb-3">
                    <Text className="block">地址：{station.address}</Text>
                    {station.phone && <Text className="block">电话：{station.phone}</Text>}
                  </View>
                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(station)}
                    >
                      <Text className="text-xs">编辑</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDeleteStation(station.id)}
                    >
                      <Text className="text-xs">删除</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* 添加奶站弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加奶站</DialogTitle>
          </DialogHeader>
          <View className="space-y-4 py-4">
            <View>
              <Text className="text-sm font-medium mb-2 block">奶站名称</Text>
              <Input
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                placeholder="请输入奶站名称"
              />
            </View>
            <View>
              <Text className="text-sm font-medium mb-2 block">地址</Text>
              <Input
                value={formData.address}
                onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                placeholder="请输入奶站地址"
              />
            </View>
            <View>
              <Text className="text-sm font-medium mb-2 block">联系电话（可选）</Text>
              <Input
                value={formData.phone}
                onInput={(e) => setFormData({ ...formData, phone: e.detail.value })}
                placeholder="请输入联系电话"
              />
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              <Text>取消</Text>
            </Button>
            <Button onClick={handleAddStation}>
              <Text className="text-white">确定</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑奶站弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑奶站</DialogTitle>
          </DialogHeader>
          <View className="space-y-4 py-4">
            <View>
              <Text className="text-sm font-medium mb-2 block">奶站名称</Text>
              <Input
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                placeholder="请输入奶站名称"
              />
            </View>
            <View>
              <Text className="text-sm font-medium mb-2 block">地址</Text>
              <Input
                value={formData.address}
                onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                placeholder="请输入奶站地址"
              />
            </View>
            <View>
              <Text className="text-sm font-medium mb-2 block">联系电话（可选）</Text>
              <Input
                value={formData.phone}
                onInput={(e) => setFormData({ ...formData, phone: e.detail.value })}
                placeholder="请输入联系电话"
              />
            </View>
          </View>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <Text>取消</Text>
            </Button>
            <Button onClick={handleEditStation}>
              <Text className="text-white">保存</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default EnterpriseStationsPage
