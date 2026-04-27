export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '待确认租赁'
    })
  : { navigationBarTitleText: '待确认租赁' }
