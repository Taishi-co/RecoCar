export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '我的需求' })
  : { navigationBarTitleText: '我的需求' }
