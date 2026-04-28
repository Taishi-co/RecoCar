import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import './form.css'

interface StationFormPageProps {}

const StationFormPage: FC<StationFormPageProps> = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [stationId, setStationId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  })
  const [enterpriseId, setEnterpriseId] = useState('')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {}
    const editId = params.id
    
    if (editId) {
      setIsEdit(true)
      setStationId(editId)
      loadStationDetails(editId)
    }

    loadEnterpriseId()
  }, [])

  const loadEnterpriseId = async () => {
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
        setEnterpriseId(enterpriseRes.data.data.id)
      }
    } catch (error) {
      console.error('加载企业信息失败:', error)
    }
  }

  const loadStationDetails = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/station/${id}`,
      })

      if (res.data.code === 200) {
        const station = res.data.data
        setFormData({
          name: station.name || '',
          address: station.address || '',
          phone: station.phone || '',
        })
      }
    } catch (error) {
      console.error('加载奶站详情失败:', error)
    }
  }

  const handleNameChange = (e: any) => {
    setFormData({ ...formData, name: e.detail.value })
  }

  const handleAddressChange = (e: any) => {
    setFormData({ ...formData, address: e.detail.value })
  }

  const handlePhoneChange = (e: any) => {
    setFormData({ ...formData, phone: e.detail.value })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none',
      })
      return
    }

    try {
      let res
      if (isEdit) {
        res = await Network.request({
          url: `/api/station/${stationId}`,
          method: 'PUT',
          data: {
            name: formData.name,
            address: formData.address,
            phone: formData.phone || undefined,
          },
        })
      } else {
        res = await Network.request({
          url: '/api/station',
          method: 'POST',
          data: {
            enterpriseId,
            name: formData.name,
            address: formData.address,
            phone: formData.phone || undefined,
          },
        })
      }

      if (res.data.code === 200) {
        Taro.showToast({
          title: isEdit ? '更新成功' : '添加成功',
          icon: 'success',
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({
          title: res.data.message || '操作失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('操作失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none',
      })
    }
  }

  return (
    <View className="station-form-page min-h-screen bg-gray-50 pb-20">
      <View className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isEdit ? '编辑奶站' : '添加奶站'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 block">
                奶站名称 <Text className="text-red-500">*</Text>
              </Text>
              <Input
                value={formData.name}
                onInput={handleNameChange}
                placeholder="请输入奶站名称"
                className="w-full"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 block">
                地址 <Text className="text-red-500">*</Text>
              </Text>
              <Input
                value={formData.address}
                onInput={handleAddressChange}
                placeholder="请输入奶站地址"
                className="w-full"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 block">
                联系电话
              </Text>
              <Input
                value={formData.phone}
                onInput={handlePhoneChange}
                placeholder="请输入联系电话（可选）"
                className="w-full"
                type="number"
              />
            </View>

            <Button className="w-full" onClick={handleSubmit}>
              <Text className="text-white">保存</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default StationFormPage
