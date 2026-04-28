export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '配送详情',
    })
  : {
      navigationBarTitleText: '配送详情',
    }
