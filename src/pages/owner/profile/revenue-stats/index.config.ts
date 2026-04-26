export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '收益统计',
      navigationBarBackgroundColor: '#3b82f6',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '收益统计',
      navigationBarBackgroundColor: '#3b82f6',
      navigationBarTextStyle: 'white'
    }
