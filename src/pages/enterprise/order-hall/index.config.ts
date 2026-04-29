export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '接单大厅',
    })
  : {
      navigationBarTitleText: '接单大厅',
    }
