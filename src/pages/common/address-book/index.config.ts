export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '地址簿'
    })
  : { navigationBarTitleText: '地址簿' }
