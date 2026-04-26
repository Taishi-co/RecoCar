export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '常用模板' })
  : { navigationBarTitleText: '常用模板' }
