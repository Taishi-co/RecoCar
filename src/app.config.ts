export default typeof defineAppConfig === 'function'
  ? defineAppConfig({
      pages: [
        'pages/index/index',              // 登录/注册页面（默认首页）
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#1890ff',
        navigationBarTitleText: '无人车共享运营平台',
        navigationBarTextStyle: 'white'
      }
    })
  : {
      pages: [
        'pages/index/index',              // 登录/注册页面（默认首页）
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#1890ff',
        navigationBarTitleText: '无人车共享运营平台',
        navigationBarTextStyle: 'white'
      }
    }
