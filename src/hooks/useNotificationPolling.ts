import { useEffect, useState, useRef } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  created_at: string
}

export function useNotificationPolling(interval: number = 30000) {
  const [unreadCount, setUnreadCount] = useState(0)
  const lastUnreadCount = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isShowingToast = useRef(false)

  // 获取未读数量
  const fetchUnreadCount = async (): Promise<number> => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) return 0

      const res = await Network.request({
        url: '/api/notifications/unread-count',
        method: 'GET',
        data: { user_id: userInfo.id }
      })

      if (res.data.code === 200) {
        return res.data.data.unreadCount || 0
      }
      return 0
    } catch (error) {
      console.error('获取未读数量失败:', error)
      return 0
    }
  }

  // 获取最新的未读通知
  const fetchLatestUnreadNotification = async (): Promise<Notification | null> => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) return null

      const res = await Network.request({
        url: '/api/notifications',
        method: 'GET',
        data: {
          user_id: userInfo.id,
          unread_only: 'true',
          limit: 1
        }
      })

      if (res.data.code === 200 && res.data.data && res.data.data.length > 0) {
        return res.data.data[0]
      }
      return null
    } catch (error) {
      console.error('获取最新通知失败:', error)
      return null
    }
  }

  // 显示Toast提示
  const showToast = async (notification: Notification) => {
    if (isShowingToast.current) return

    isShowingToast.current = true

    Taro.showModal({
      title: notification.title,
      content: `${notification.content}\n\n点击确定查看详情`,
      showCancel: true,
      cancelText: '忽略',
      confirmText: '查看',
      success: (res) => {
        if (res.confirm) {
          // 跳转到通知列表
          Taro.navigateTo({
            url: '/pages/notifications/index'
          })
        }
        isShowingToast.current = false
      },
      fail: () => {
        isShowingToast.current = false
      }
    })
  }

  // 初始化和轮询
  useEffect(() => {
    // 初始化未读数量
    fetchUnreadCount().then(count => {
      setUnreadCount(count)
      lastUnreadCount.current = count
    })

    // 开始轮询
    timerRef.current = setInterval(async () => {
      const currentCount = await fetchUnreadCount()

      // 检查是否有新通知
      if (currentCount > lastUnreadCount.current) {
        // 获取最新的未读通知
        const latestNotification = await fetchLatestUnreadNotification()
        if (latestNotification) {
          await showToast(latestNotification)
        }

        lastUnreadCount.current = currentCount
      }

      setUnreadCount(currentCount)
    }, interval)

    // 清理定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [interval])

  // 手动刷新未读数量
  const refreshUnreadCount = async () => {
    const count = await fetchUnreadCount()
    setUnreadCount(count)
    lastUnreadCount.current = count
    return count
  }

  return {
    unreadCount,
    refreshUnreadCount
  }
}
