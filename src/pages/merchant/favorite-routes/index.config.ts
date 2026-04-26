export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '常用线路'
    })
  : { navigationBarTitleText: '常用线路' }
