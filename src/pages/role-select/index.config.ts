export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '选择角色',
      navigationBarBackgroundColor: '#1890ff',
      navigationBarTextStyle: 'white'
    })
  : { navigationBarTitleText: '选择角色' }
