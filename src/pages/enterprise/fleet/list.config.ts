export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车队管理',
      navigationBarBackgroundColor: '#1890ff',
      navigationBarTextStyle: 'white'
    })
  : { navigationBarTitleText: '车队管理' }
