import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Pencil, Plus, Building, Warehouse, Star } from 'lucide-react-taro'

export default function AddressBookPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    latitude: '',
    longitude: '',
    tag: '',
    address_type: router.params.type || 'pickup',
    is_default: false
  })

  const userInfo = Taro.getStorageSync('userInfo')

  useLoad(() => {
    loadAddressBooks()
  })

  const loadAddressBooks = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/address-books?user_id=${userInfo.id}&address_type=${formData.address_type}`
      })

      if (res.data.code === 200) {
        setAddresses(res.data.data || [])
      }
    } catch (error) {
      console.error('加载地址簿失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditMode(false)
    setCurrentAddress(null)
    setFormData({
      title: '',
      address: '',
      latitude: '',
      longitude: '',
      tag: '',
      address_type: router.params.type || 'pickup',
      is_default: false
    })
    setShowAddModal(true)
  }

  const handleEdit = (address: any) => {
    setEditMode(true)
    setCurrentAddress(address)
    setFormData({
      title: address.title,
      address: address.address,
      latitude: address.latitude.toString(),
      longitude: address.longitude.toString(),
      tag: address.tag || '',
      address_type: address.address_type,
      is_default: address.is_default
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    const confirmResult = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？'
    })

    if (!confirmResult.confirm) return

    try {
      const deleteRes = await Network.request({
        url: `/api/address-books/${id}`,
        method: 'DELETE'
      })

      if (deleteRes.data.code === 200) {
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        loadAddressBooks()
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/address-books/${id}/set-default`,
        method: 'POST'
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: '设置成功',
          icon: 'success'
        })
        loadAddressBooks()
      }
    } catch (error) {
      console.error('设置默认地址失败:', error)
      Taro.showToast({
        title: '设置失败',
        icon: 'none'
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.address || !formData.latitude || !formData.longitude) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const submitData = {
      ...formData,
      user_id: userInfo.id,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    }

    try {
      const res = await Network.request({
        url: editMode && currentAddress ? `/api/address-books/${currentAddress.id}` : '/api/address-books',
        method: editMode && currentAddress ? 'PUT' : 'POST',
        data: submitData
      })

      if (res.data.code === 200) {
        Taro.showToast({
          title: editMode ? '更新成功' : '添加成功',
          icon: 'success'
        })
        setShowAddModal(false)
        loadAddressBooks()
      }
    } catch (error) {
      console.error('保存地址失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }

  const handleSelect = (address: any) => {
    // 返回选中的地址
    Taro.eventCenter.trigger('addressSelected', address)
    Taro.navigateBack()
  }

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case '家':
      case 'home':
        return <Building size={16} color="#666" />
      case '公司':
      case 'office':
        return <Building size={16} color="#666" />
      case '仓库':
      case 'warehouse':
        return <Warehouse size={16} color="#666" />
      default:
        return null
    }
  }

  const getAddressTypeText = () => {
    return formData.address_type === 'pickup' ? '取货地址' : '送货地址'
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4 pb-20">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-xl font-bold">{getAddressTypeText()}簿</Text>
        <Button
          size="sm"
          className="bg-blue-500"
          onClick={handleAdd}
        >
          <Plus size={16} color="white" className="mr-1" />
          <Text className="text-xs text-white">添加</Text>
        </Button>
      </View>

      {loading ? (
        <View className="flex justify-center items-center py-20">
          <Text className="text-gray-500">加载中...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-20">
          <Text className="text-gray-400 mb-4">暂无地址</Text>
          <Button
            size="sm"
            className="bg-blue-500"
            onClick={handleAdd}
          >
            <Text className="text-xs text-white">添加第一个地址</Text>
          </Button>
        </View>
      ) : (
        <View className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className="border-2 hover:border-blue-200">
              <CardContent className="p-4">
                <View className="flex justify-between items-start">
                  <View className="flex-1">
                    <View className="flex items-center mb-2">
                      {getTagIcon(address.tag)}
                      <Text className="text-sm font-medium ml-2">{address.title}</Text>
                      {address.is_default && (
                        <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded">
                          <Text className="text-xs text-blue-600">默认</Text>
                        </View>
                      )}
                    </View>
                    <Text className="block text-sm text-gray-600 mb-1">{address.address}</Text>
                    <Text className="block text-xs text-gray-400">
                      坐标：{address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <View className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                    >
                      <Pencil size={16} color="#666" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </Button>
                  </View>
                </View>
                <View className="mt-3 pt-3 border-t">
                  <View className="flex justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSelect(address)}
                    >
                      <Text className="text-xs">选择</Text>
                    </Button>
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Star size={14} color="#fbbf24" className="mr-1" />
                        <Text className="text-xs">设为默认</Text>
                      </Button>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {/* 添加/编辑地址弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <View className="bg-white w-full rounded-t-2xl p-4 max-h-[90vh] overflow-auto">
            <View className="flex justify-between items-center mb-4">
              <Text className="text-lg font-bold">{editMode ? '编辑地址' : '添加地址'}</Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                <Text className="text-xl">×</Text>
              </Button>
            </View>

            <View className="space-y-4">
              <View>
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>地址标题
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：公司、家、仓库"
                    value={formData.title}
                    onInput={(e) => setFormData({ ...formData, title: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>详细地址
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入详细地址"
                    value={formData.address}
                    onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>纬度
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="39.908822"
                    type="digit"
                    value={formData.latitude}
                    onInput={(e) => setFormData({ ...formData, latitude: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">
                  <Text className="text-red-500">*</Text>经度
                </Label>
                <View className="bg-gray-50 rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="116.397499"
                    type="digit"
                    value={formData.longitude}
                    onInput={(e) => setFormData({ ...formData, longitude: e.detail.value })}
                  />
                </View>
              </View>

              <View>
                <Label className="block text-sm font-medium mb-2">标签（可选）</Label>
                <View className="flex gap-2">
                  {['家', '公司', '仓库'].map((tag) => (
                    <Button
                      key={tag}
                      size="sm"
                      variant={formData.tag === tag ? 'default' : 'outline'}
                      className={formData.tag === tag ? 'bg-blue-500' : ''}
                      onClick={() => setFormData({ ...formData, tag })}
                    >
                      <Text className={formData.tag === tag ? 'text-white' : ''}>{tag}</Text>
                    </Button>
                  ))}
                </View>
              </View>

              <View className="flex items-center">
                <Text className="text-sm mr-2">设为默认地址</Text>
                <Button
                  size="sm"
                  variant={formData.is_default ? 'default' : 'outline'}
                  className={formData.is_default ? 'bg-blue-500' : ''}
                  onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                >
                  <Text className={formData.is_default ? 'text-white' : ''}>{formData.is_default ? '已设为默认' : '设为默认'}</Text>
                </Button>
              </View>

              <View className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  <Text>取消</Text>
                </Button>
                <Button
                  className="flex-1 bg-blue-500"
                  onClick={handleSubmit}
                >
                  <Text className="text-white">保存</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
