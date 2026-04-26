export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '线路地图'
    })
  : { navigationBarTitleText: '线路地图' }
