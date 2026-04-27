export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车机模拟数据Demo'
    })
  : { navigationBarTitleText: '车机模拟数据Demo' }
