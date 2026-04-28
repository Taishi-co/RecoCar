export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '对外服务',
      navigationBarBackgroundColor: '#1890ff',
      navigationBarTextStyle: 'white'
    })
  : { navigationBarTitleText: '对外服务' }
