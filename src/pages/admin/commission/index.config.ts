export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '佣金审核' })
  : { navigationBarTitleText: '佣金审核' }
