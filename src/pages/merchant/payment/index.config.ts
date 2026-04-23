export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '运费支付' })
  : { navigationBarTitleText: '运费支付' }
