export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '调度中心',
      navigationBarBackgroundColor: '#1890ff',
      navigationBarTextStyle: 'white'
    })
  : { navigationBarTitleText: '调度中心' }
