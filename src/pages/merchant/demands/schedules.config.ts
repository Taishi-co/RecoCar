export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '定时计划' })
  : { navigationBarTitleText: '定时计划' }
