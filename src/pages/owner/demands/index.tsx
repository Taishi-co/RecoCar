import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Demand {
  id: string
  cargo_name: string
  cargo_type: string
  weight: number
  volume: number
  pickup_time: string
  pickup_address: string
  delivery_address: string
  remarks: string | null
  status: string
  created_at: string
  merchant_id: string
  merchant?: {
    phone: string
    name: string
  }
}

export default function OwnerDemands() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [acceptNote, setAcceptNote] = useState('')

  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    setLoading(true)

    try {
      const res = await Network.request({
        url: '/api/demands?status=pending',
        method: 'GET'
      })

      console.log('需求列表响应:', res.data)

      if (res.data.code === 200) {
        setDemands(res.data.data || [])
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载需求列表失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const getCargoTypeText = (type: string) => {
    const types: Record<string, string> = {
      normal: '普通货物',
      fragile: '易碎品',
      refrigerated: '冷藏品',
      bulky: '大件货物',
      hazardous: '危险品'
    }
    return types[type] || type
  }

  const getCargoTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-blue-500',
      fragile: 'bg-orange-500',
      refrigerated: 'bg-cyan-500',
      bulky: 'bg-purple-500',
      hazardous: 'bg-red-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const handleAcceptDemand = (demand: Demand) => {
    setSelectedDemand(demand)
    setShowAcceptDialog(true)
    setAcceptNote('')
  }

  const handleCloseAcceptDialog = () => {
    setShowAcceptDialog(false)
    setSelectedDemand(null)
    setAcceptNote('')
  }

  const handleConfirmAccept = async () => {
    if (!selectedDemand) return

    setLoading(true)

    try {
      const res = await Network.request({
        url: `/api/demands/${selectedDemand.id}/accept?id=${selectedDemand.id}`,
        method: 'POST',
        data: { note: acceptNote }
      })

      console.log('接单响应:', res.data)

      if (res.data.code === 200) {
        Taro.showToast({
          title: '接单成功',
          icon: 'success'
        })

        setShowAcceptDialog(false)
        setSelectedDemand(null)
        setAcceptNote('')

        // 重新加载需求列表
        loadDemands()
      } else {
        Taro.showToast({
          title: res.data.message || '接单失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('接单失败:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDemands()
  }

  return (
    <View className="min-h-screen bg-gray-100">
      <View className="px-4 py-4">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                待接单需求
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Text className="text-xs">刷新</Text>
              </Button>
            </View>
          </CardHeader>
          <CardContent>
            {loading ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm">加载中...</Text>
              </View>
            ) : demands.length === 0 ? (
              <View className="text-center py-8">
                <Text className="block text-gray-500 text-sm mb-4">
                  暂无待接单需求
                </Text>
                <Button
                  className="bg-blue-500"
                  onClick={handleRefresh}
                >
                  <Text>刷新</Text>
                </Button>
              </View>
            ) : (
              <View className="space-y-3">
                {demands.map((demand) => (
                  <View key={demand.id} className="bg-gray-50 rounded-lg p-4">
                    <View className="flex justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="block font-medium text-base mb-1">
                          {demand.cargo_name}
                        </Text>
                        <View className="flex items-center gap-2 mb-2">
                          <Badge className={getCargoTypeColor(demand.cargo_type)}>
                            <Text className="text-white text-xs">
                              {getCargoTypeText(demand.cargo_type)}
                            </Text>
                          </Badge>
                          <Badge className="bg-green-500">
                            <Text className="text-white text-xs">
                              待接单
                            </Text>
                          </Badge>
                        </View>
                      </View>
                      <Button
                        size="sm"
                        className="bg-blue-500"
                        onClick={() => handleAcceptDemand(demand)}
                      >
                        <Text className="text-xs">接单</Text>
                      </Button>
                    </View>
                    <View className="space-y-2 mb-3">
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">取货:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.pickup_address}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">送货:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.delivery_address}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">时间:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {new Date(demand.pickup_time).toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex items-start">
                        <Text className="text-xs text-gray-500 w-16 flex-shrink-0">规格:</Text>
                        <Text className="text-xs text-gray-700 flex-1">
                          {demand.weight}kg / {demand.volume}m³
                        </Text>
                      </View>
                      {demand.remarks && (
                        <View className="flex items-start">
                          <Text className="text-xs text-gray-500 w-16 flex-shrink-0">备注:</Text>
                          <Text className="text-xs text-gray-700 flex-1">
                            {demand.remarks}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-gray-400">
                      发布时间: {new Date(demand.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 接单确认弹窗 */}
      {showAcceptDialog && selectedDemand && (
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent className="sm:max-w-md">
            <View className="p-6">
              <Text className="block text-lg font-semibold mb-2">
                确认接单
              </Text>
              <Text className="block text-sm text-gray-500 mb-4">
                请确认接单：{selectedDemand.cargo_name}
              </Text>
              <View className="bg-gray-50 rounded-lg p-4 mb-4">
                <View className="space-y-2">
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">取货:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.pickup_address}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">送货:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.delivery_address}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">时间:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {new Date(selectedDemand.pickup_time).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex items-start">
                    <Text className="text-xs text-gray-500 w-16 flex-shrink-0">规格:</Text>
                    <Text className="text-xs text-gray-700 flex-1">
                      {selectedDemand.weight}kg / {selectedDemand.volume}m³
                    </Text>
                  </View>
                </View>
              </View>
              <View>
                <Label className="block text-sm font-medium mb-2">
                  备注说明（可选）
                </Label>
                <View className="bg-gray-50 rounded-lg p-4">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="如：预计10分钟内到达取货点"
                    maxlength={200}
                    value={acceptNote}
                    onInput={(e) => setAcceptNote(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex gap-3 mt-6">
                <Button
                  className="flex-1 bg-gray-200"
                  onClick={handleCloseAcceptDialog}
                  disabled={loading}
                >
                  <Text>取消</Text>
                </Button>
                <Button
                  className="flex-1 bg-blue-500"
                  onClick={handleConfirmAccept}
                  disabled={loading}
                >
                  <Text>{loading ? '接单中...' : '确认接单'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
