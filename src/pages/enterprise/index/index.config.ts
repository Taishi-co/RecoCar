export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '企业首页',
    })
  : {
      navigationBarTitleText: '企业首页',
    }
