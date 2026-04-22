export default typeof definePageConfig === 'function'
  ? defineAppConfig({
      pages: [
        'pages/index/index',              // 登录/注册页面（默认首页）
        'pages/owner/vehicles/index',      // 车主端-车辆管理
        'pages/owner/demands/index',       // 车主端-需求列表
        'pages/owner/orders/index',        // 车主端-订单管理
        'pages/owner/stats/index',         // 车主端-统计
        'pages/owner/profile/index',       // 车主端-我的
        'pages/merchant/demands/index',    // 需求方端-发布需求
        'pages/merchant/orders/index',     // 需求方端-订单管理
        'pages/merchant/stats/index',      // 需求方端-统计
        'pages/merchant/profile/index',    // 需求方端-我的
        'pages/admin/users/index',         // 运营端-用户管理
        'pages/admin/vehicles/index',      // 运营端-车辆审核
        'pages/admin/orders/index',        // 运营端-订单管理
        'pages/admin/stats/index',         // 运营端-数据统计
        'pages/admin/settings/index',      // 运营端-设置
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
        'pages/owner/vehicles/index',      // 车主端-车辆管理
        'pages/owner/demands/index',       // 车主端-需求列表
        'pages/owner/orders/index',        // 车主端-订单管理
        'pages/owner/stats/index',         // 车主端-统计
        'pages/owner/profile/index',       // 车主端-我的
        'pages/merchant/demands/index',    // 需求方端-发布需求
        'pages/merchant/orders/index',     // 需求方端-订单管理
        'pages/merchant/stats/index',      // 需求方端-统计
        'pages/merchant/profile/index',    // 需求方端-我的
        'pages/admin/users/index',         // 运营端-用户管理
        'pages/admin/vehicles/index',      // 运营端-车辆审核
        'pages/admin/orders/index',        // 运营端-订单管理
        'pages/admin/stats/index',         // 运营端-数据统计
        'pages/admin/settings/index',      // 运营端-设置
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#1890ff',
        navigationBarTitleText: '无人车共享运营平台',
        navigationBarTextStyle: 'white'
      }
    }
