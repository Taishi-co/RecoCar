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

  useEffect(() => {
    console.log('奶站管理页面加载')
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

  const showAddDialog = () => {
    Taro.navigateTo({ url: '/pages/enterprise/stations/form' })
  }

  const showEditDialog = (station: Station) => {
    Taro.navigateTo({ url: `/pages/enterprise/stations/form?id=${station.id}` })
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
              onClick={showAddDialog}
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
                  onClick={showAddDialog}
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
                      onClick={() => showEditDialog(station)}
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
    </View>
  )
}

export default EnterpriseStationsPage
