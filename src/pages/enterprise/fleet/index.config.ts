export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车辆管理',
    })
  : {
      navigationBarTitleText: '车辆管理',
    }
