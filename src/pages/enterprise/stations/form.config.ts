export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '奶站信息',
    })
  : {
      navigationBarTitleText: '奶站信息',
    }
