export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '佣金支付' })
  : { navigationBarTitleText: '佣金支付' }
