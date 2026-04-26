export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '修改密码'
    })
  : { navigationBarTitleText: '修改密码' }
