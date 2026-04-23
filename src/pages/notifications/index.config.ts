export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '通知消息',
      enablePullDownRefresh: true,
      onReachBottomDistance: 50
    })
  : {
      navigationBarTitleText: '通知消息',
      enablePullDownRefresh: true,
      onReachBottomDistance: 50
    }
