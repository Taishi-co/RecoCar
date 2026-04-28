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
  const [keyword, setKeyword] = useState('')
  const [enterpriseId, setEnterpriseId] = useState('')

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
      } else {
        Taro.showToast({
          title: '获取企业信息失败',
          icon: 'none',
        })
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
        data: {
          enterpriseId: entId,
          keyword: keyword || undefined,
        },
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

  const handleSearch = () => {
    if (enterpriseId) {
      loadStations(enterpriseId)
    }
  }

  const handleDelete = async (stationId: string, stationName: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${stationName}"吗？`,
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

  const handleCreate = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
    })
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      active: '运营中',
      inactive: '已停用',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      active: 'text-green-600',
      inactive: 'text-gray-500',
    }
    return colorMap[status] || ''
  }

  return (
    <View className="enterprise-stations min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-full">
        <View className="p-4">
          {/* 搜索栏 */}
          <View className="flex gap-2 mb-4">
            <View className="flex-1">
              <Input
                className="w-full"
                placeholder="搜索奶站名称或地址"
                value={keyword}
                onInput={(e) => setKeyword(e.detail.value)}
              />
            </View>
            <Button className="flex-shrink-0" onClick={handleSearch}>
              <Text>搜索</Text>
            </Button>
            <Button className="flex-shrink-0" onClick={handleCreate}>
              <Text>新增</Text>
            </Button>
          </View>

          {/* 奶站列表 */}
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-gray-500">加载中...</Text>
            </View>
          ) : stations.length === 0 ? (
            <Card className="mb-4">
              <CardContent className="p-8 text-center">
                <Text className="text-gray-500 text-sm block">
                  {keyword ? '未找到匹配的奶站' : '暂无奶站'}
                </Text>
              </CardContent>
            </Card>
          ) : (
            stations.map((station) => (
              <Card key={station.id} className="mb-4">
                <CardHeader>
                  <View className="flex justify-between items-center">
                    <CardTitle className="text-base flex-1">
                      {station.name}
                    </CardTitle>
                    <Text className={`text-xs ${getStatusColor(station.status)}`}>
                      {getStatusText(station.status)}
                    </Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="text-sm text-gray-600 mb-3">
                    <Text className="block mb-1">📍 {station.address}</Text>
                    {station.phone && (
                      <Text className="block">📞 {station.phone}</Text>
                    )}
                  </View>

                  <View className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCreate()}
                    >
                      <Text className="text-xs">编辑</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(station.id, station.name)}
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
