export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '发布需求' })
  : { navigationBarTitleText: '发布需求' }
