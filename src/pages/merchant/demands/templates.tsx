import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ArrowRight, FileText } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface DemandTemplate {
  id: string
  user_id: string
  template_name: string
  cargo_name: string
  cargo_type: string
  weight: number
  volume: number
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  remarks?: string
  is_default: boolean
  use_count: number
  created_at: string
  updated_at: string
}

interface FormData {
  template_name: string
  cargo_name: string
  cargo_type: string
  weight: string
  volume: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  remarks: string
  is_default: boolean
}

export default function DemandTemplates() {
  const [templates, setTemplates] = useState<DemandTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DemandTemplate | null>(null)
  const [formData, setFormData] = useState<FormData>({
    template_name: '',
    cargo_name: '',
    cargo_type: 'normal',
    weight: '',
    volume: '',
    pickup_address: '',
    pickup_lat: 0,
    pickup_lng: 0,
    delivery_address: '',
    delivery_lat: 0,
    delivery_lng: 0,
    remarks: '',
    is_default: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<DemandTemplate | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      const res = await Network.request({
        url: '/api/demand-templates',
        method: 'GET',
        data: { userId: userInfo.id }
      })

      console.log('常用模板响应:', res.data)

      if (res.data.code === 200) {
        setTemplates(res.data.data || [])
      }
    } catch (err) {
      console.error('加载常用模板失败:', err)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({
      template_name: '',
      cargo_name: '',
      cargo_type: 'normal',
      weight: '',
      volume: '',
      pickup_address: '',
      pickup_lat: 0,
      pickup_lng: 0,
      delivery_address: '',
      delivery_lat: 0,
      delivery_lng: 0,
      remarks: '',
      is_default: false
    })
    setShowDialog(true)
  }

  const handleEditTemplate = (template: DemandTemplate) => {
    setEditingTemplate(template)
    setFormData({
      template_name: template.template_name,
      cargo_name: template.cargo_name,
      cargo_type: template.cargo_type,
      weight: template.weight.toString(),
      volume: template.volume.toString(),
      pickup_address: template.pickup_address,
      pickup_lat: template.pickup_lat,
      pickup_lng: template.pickup_lng,
      delivery_address: template.delivery_address,
      delivery_lat: template.delivery_lat,
      delivery_lng: template.delivery_lng,
      remarks: template.remarks || '',
      is_default: template.is_default
    })
    setShowDialog(true)
  }

  const handleDeleteTemplate = (template: DemandTemplate) => {
    setDeletingTemplate(template)
    setShowDeleteDialog(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!deletingTemplate) return

    try {
      const res = await Network.request({
        url: `/api/demand-templates/${deletingTemplate.id}`,
        method: 'DELETE'
      })

      console.log('删除模板响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        loadTemplates()
      } else {
        Taro.showToast({
          title: res.data.message || '删除失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('删除模板失败:', err)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    } finally {
      setShowDeleteDialog(false)
      setDeletingTemplate(null)
    }
  }

  const handleSubmit = async () => {
    if (!formData.template_name || !formData.cargo_name || !formData.weight || !formData.volume ||
        !formData.pickup_address || !formData.delivery_address) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)

    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

      const submitData = {
        user_id: userInfo.id,
        template_name: formData.template_name,
        cargo_name: formData.cargo_name,
        cargo_type: formData.cargo_type,
        weight: parseFloat(formData.weight),
        volume: parseFloat(formData.volume),
        pickup_address: formData.pickup_address,
        pickup_lat: formData.pickup_lat,
        pickup_lng: formData.pickup_lng,
        delivery_address: formData.delivery_address,
        delivery_lat: formData.delivery_lat,
        delivery_lng: formData.delivery_lng,
        remarks: formData.remarks || undefined,
        is_default: formData.is_default
      }

      const res = editingTemplate
        ? await Network.request({
            url: `/api/demand-templates/${editingTemplate.id}`,
            method: 'PUT',
            data: submitData
          })
        : await Network.request({
            url: '/api/demand-templates',
            method: 'POST',
            data: submitData
          })

      console.log('保存模板响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: editingTemplate ? '更新成功' : '创建成功',
          icon: 'success'
        })
        setShowDialog(false)
        loadTemplates()
      } else {
        Taro.showToast({
          title: res.data.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('保存模板失败:', err)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUseTemplate = (template: DemandTemplate) => {
    const params = {
      template_id: template.id,
      cargo_name: template.cargo_name,
      cargo_type: template.cargo_type,
      weight: template.weight.toString(),
      volume: template.volume.toString(),
      pickup_address: template.pickup_address,
      pickup_lat: template.pickup_lat,
      pickup_lng: template.pickup_lng,
      delivery_address: template.delivery_address,
      delivery_lat: template.delivery_lat,
      delivery_lng: template.delivery_lng,
      remarks: template.remarks || ''
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    Taro.navigateTo({
      url: `/pages/merchant/demands/publish?${queryString}`
    })
  }

  const getCargoTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      normal: '普通货物',
      fresh: '生鲜货物',
      fragile: '易碎品'
    }
    return typeMap[type] || type
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 导航菜单 */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-3">
          <View className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateBack()}
            >
              <Text className="text-xs">返回</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/demands/list' })}
            >
              <Text className="text-xs">我的需求</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/orders/index' })}
            >
              <Text className="text-xs">订单管理</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => Taro.navigateTo({ url: '/pages/merchant/profile/index' })}
            >
              <Text className="text-xs">我的</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* 标题栏 */}
      <View className="bg-white px-4 py-3 mb-2">
        <View className="flex items-center justify-between">
          <Text className="block text-lg font-semibold text-gray-900">
            常用模板
          </Text>
          <Button
            size="sm"
            className="bg-blue-500"
            onClick={handleCreateTemplate}
          >
            <Plus size={16} color="#ffffff" />
            <Text className="ml-1 text-xs text-white">新建模板</Text>
          </Button>
        </View>
      </View>

      {/* 模板列表 */}
      {loading ? (
        <View className="flex items-center justify-center py-8">
          <Text className="block text-gray-500 text-sm">加载中...</Text>
        </View>
      ) : templates.length === 0 ? (
        <View className="flex flex-col items-center justify-center py-16 px-4">
          <FileText size={64} color="#d1d5db" />
          <Text className="block text-gray-500 text-sm mt-4 text-center">
            暂无常用模板
          </Text>
          <Text className="block text-gray-400 text-xs mt-2 text-center">
            点击&quot;新建模板&quot;创建您的第一个模板
          </Text>
        </View>
      ) : (
        <View className="px-4 space-y-3 pb-4">
          {templates.map((template) => (
            <Card key={template.id} className="bg-white rounded-lg shadow-sm">
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  <View className="flex-1">
                    <View className="flex items-center gap-2 mb-2">
                      <Text className="block text-base font-semibold text-gray-900">
                        {template.template_name}
                      </Text>
                      {template.is_default && (
                        <Text className="text-xs text-blue-500">默认</Text>
                      )}
                    </View>

                    <View className="space-y-1">
                      <Text className="block text-sm text-gray-600">
                        货品：{template.cargo_name}（{getCargoTypeText(template.cargo_type)}）
                      </Text>
                      <Text className="block text-sm text-gray-600">
                        重量：{template.weight} kg / 体积：{template.volume} m³
                      </Text>
                      <Text className="block text-sm text-gray-600">
                        起：{template.pickup_address}
                      </Text>
                      <Text className="block text-sm text-gray-600">
                        送：{template.delivery_address}
                      </Text>
                      {template.remarks && (
                        <Text className="block text-sm text-gray-500">
                          备注：{template.remarks}
                        </Text>
                      )}
                      <Text className="block text-xs text-gray-400 mt-2">
                        使用次数：{template.use_count} 次
                      </Text>
                    </View>
                  </View>

                  <View className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-green-500"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <ArrowRight size={14} color="#ffffff" />
                      <Text className="ml-1 text-xs text-white">使用</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Pencil size={14} color="#6b7280" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {/* 创建/编辑模板对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? '编辑模板' : '新建模板'}
            </DialogTitle>
          </DialogHeader>

          <View className="space-y-4">
            <View>
              <Text className="block text-sm font-medium mb-1">模板名称 *</Text>
              <Input
                value={formData.template_name}
                placeholder="请输入模板名称"
                onInput={(e) => setFormData({ ...formData, template_name: e.detail.value })}
              />
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">货品名称 *</Text>
              <Input
                value={formData.cargo_name}
                placeholder="请输入货品名称"
                onInput={(e) => setFormData({ ...formData, cargo_name: e.detail.value })}
              />
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">货品类型 *</Text>
              <Picker
                mode="selector"
                range={['普通货物', '生鲜货物', '易碎品']}
                value={['normal', 'fresh', 'fragile'].indexOf(formData.cargo_type)}
                onChange={(e) => {
                  const types = ['normal', 'fresh', 'fragile']
                  setFormData({ ...formData, cargo_type: types[e.detail.value] })
                }}
              >
                <Input
                  value={['普通货物', '生鲜货物', '易碎品'][['normal', 'fresh', 'fragile'].indexOf(formData.cargo_type)]}
                  placeholder="请选择货品类型"
                  disabled
                />
              </Picker>
            </View>

            <View className="flex gap-3">
              <View className="flex-1">
                <Text className="block text-sm font-medium mb-1">重量 *</Text>
                <Input
                  type="number"
                  value={formData.weight}
                  placeholder="重量(kg)"
                  onInput={(e) => setFormData({ ...formData, weight: e.detail.value })}
                />
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-medium mb-1">体积 *</Text>
                <Input
                  type="number"
                  value={formData.volume}
                  placeholder="体积(m³)"
                  onInput={(e) => setFormData({ ...formData, volume: e.detail.value })}
                />
              </View>
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">取货地址 *</Text>
              <Input
                value={formData.pickup_address}
                placeholder="请输入取货地址"
                onInput={(e) => setFormData({ ...formData, pickup_address: e.detail.value })}
              />
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">送货地址 *</Text>
              <Input
                value={formData.delivery_address}
                placeholder="请输入送货地址"
                onInput={(e) => setFormData({ ...formData, delivery_address: e.detail.value })}
              />
            </View>

            <View>
              <Text className="block text-sm font-medium mb-1">备注（选填）</Text>
              <Input
                value={formData.remarks}
                placeholder="请输入备注"
                onInput={(e) => setFormData({ ...formData, remarks: e.detail.value })}
              />
            </View>
          </View>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              <Text className="text-xs">取消</Text>
            </Button>
            <Button
              className="bg-blue-500"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Text className="text-xs text-white">
                {submitting ? '保存中...' : '保存'}
              </Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <View className="py-4">
            <Text className="block text-sm text-gray-700 text-center">
              确定要删除模板&quot;{deletingTemplate?.template_name}&quot;吗？
            </Text>
          </View>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              <Text className="text-xs">取消</Text>
            </Button>
            <Button
              className="bg-red-500"
              onClick={confirmDeleteTemplate}
            >
              <Text className="text-xs text-white">删除</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}
