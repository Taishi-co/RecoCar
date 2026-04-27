export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的租赁记录'
    })
  : { navigationBarTitleText: '我的租赁记录' }
