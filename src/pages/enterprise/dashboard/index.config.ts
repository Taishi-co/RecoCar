export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '企业工作台',
      navigationBarBackgroundColor: '#1890ff',
      navigationBarTextStyle: 'white'
    })
  : { navigationBarTitleText: '企业工作台' }
