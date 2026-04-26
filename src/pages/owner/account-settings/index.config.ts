export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '账号设置'
    })
  : { navigationBarTitleText: '账号设置' }
