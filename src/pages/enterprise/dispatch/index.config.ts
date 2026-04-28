export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '调度中心',
    })
  : {
      navigationBarTitleText: '调度中心',
    }
