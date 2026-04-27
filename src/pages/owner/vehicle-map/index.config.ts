export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '车辆位置地图'
    })
  : { navigationBarTitleText: '车辆位置地图' }
