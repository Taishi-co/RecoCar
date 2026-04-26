export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '修改手机号'
    })
  : { navigationBarTitleText: '修改手机号' }
