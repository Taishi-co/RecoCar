export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '待接单需求'
    })
  : { navigationBarTitleText: '待接单需求' }
