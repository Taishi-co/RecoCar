export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '角色管理'
    })
  : { navigationBarTitleText: '角色管理' }
