export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车队管理',
    })
  : {
      navigationBarTitleText: '车队管理',
    }
