export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '处理取消申请',
      navigationBarBackgroundColor: '#fff',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '处理取消申请',
      navigationBarBackgroundColor: '#fff',
      navigationBarTextStyle: 'black'
    }
