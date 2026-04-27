export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车辆详情'
    })
  : {
      navigationBarTitleText: '车辆详情'
    }
