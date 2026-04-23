export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '登录/注册' })
  : { navigationBarTitleText: '登录/注册' }
