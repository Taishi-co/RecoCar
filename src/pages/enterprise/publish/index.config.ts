export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '发布配送',
    })
  : {
      navigationBarTitleText: '发布配送',
    }
