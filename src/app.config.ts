export default typeof definePageConfig === 'function'
  ? defineAppConfig({
      pages: [
        'pages/index/index',                    // 登录/注册页面（默认首页）
        'pages/owner/vehicles/index',          // 车主端-车辆管理
        'pages/owner/demands/index',           // 车主端-需求列表
        'pages/owner/orders/index',            // 车主端-订单管理
        'pages/owner/cancellations/index',    // 车主端-处理取消申请
        'pages/owner/commission-payment/index',// 车主端-佣金支付
        'pages/owner/stats/index',             // 车主端-统计
        'pages/owner/profile/index',           // 车主端-我的
        'pages/owner/profile/revenue-stats/index', // 车主端-收益统计
        'pages/owner/account-settings/index',  // 车主端-账号设置
        'pages/owner/profile-edit/index',      // 车主端-个人信息编辑
        'pages/owner/change-phone/index',      // 车主端-修改手机号
        'pages/owner/change-password/index',   // 车主端-修改密码
        'pages/merchant/demands/index',        // 需求方端-发布需求
        'pages/merchant/demands/publish',      // 需求方端-发布需求表单
        'pages/merchant/demands/list',         // 需求方端-需求列表
        'pages/merchant/demands/edit',         // 需求方端-编辑需求
        'pages/merchant/demands/templates',   // 需求方端-常用模板
        'pages/merchant/demands/schedules',   // 需求方端-定时计划
        'pages/merchant/orders/index',         // 需求方端-订单管理
        'pages/merchant/payment/index',        // 需求方端-付款
        'pages/merchant/address-books/index',  // 需求方端-地址簿
        'pages/merchant/favorite-routes/index',// 需求方端-常用线路
        'pages/merchant/route-map/index',      // 线路地图显示
        'pages/merchant/stats/index',          // 需求方端-统计
        'pages/merchant/profile/index',        // 需求方端-我的
        'pages/notifications/index',           // 通知消息列表
        'pages/admin/users/index',             // 运营端-用户管理
        'pages/admin/vehicles/index',          // 运营端-车辆审核
        'pages/admin/orders/index',            // 运营端-订单管理
        'pages/admin/commission/index',        // 运营端-佣金审核
        'pages/admin/stats/index',             // 运营端-数据统计
        'pages/admin/settings/index',          // 运营端-设置
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
        'pages/index/index',                    // 登录/注册页面（默认首页）
        'pages/owner/vehicles/index',          // 车主端-车辆管理
        'pages/owner/demands/index',           // 车主端-需求列表
        'pages/owner/orders/index',            // 车主端-订单管理
        'pages/owner/cancellations/index',    // 车主端-处理取消申请
        'pages/owner/commission-payment/index',// 车主端-佣金支付
        'pages/owner/stats/index',             // 车主端-统计
        'pages/owner/profile/index',           // 车主端-我的
        'pages/owner/profile/revenue-stats/index', // 车主端-收益统计
        'pages/owner/account-settings/index',  // 车主端-账号设置
        'pages/owner/profile-edit/index',      // 车主端-个人信息编辑
        'pages/owner/change-phone/index',      // 车主端-修改手机号
        'pages/owner/change-password/index',   // 车主端-修改密码
        'pages/merchant/demands/index',        // 需求方端-发布需求
        'pages/merchant/demands/publish',      // 需求方端-发布需求表单
        'pages/merchant/demands/list',         // 需求方端-需求列表
        'pages/merchant/demands/edit',         // 需求方端-编辑需求
        'pages/merchant/demands/templates',   // 需求方端-常用模板
        'pages/merchant/demands/schedules',   // 需求方端-定时计划
        'pages/merchant/orders/index',         // 需求方端-订单管理
        'pages/merchant/payment/index',        // 需求方端-付款
        'pages/merchant/address-books/index',  // 需求方端-地址簿
        'pages/merchant/favorite-routes/index',// 需求方端-常用线路
        'pages/merchant/route-map/index',      // 线路地图显示
        'pages/merchant/stats/index',          // 需求方端-统计
        'pages/merchant/profile/index',        // 需求方端-我的
        'pages/notifications/index',           // 通知消息列表
        'pages/admin/users/index',             // 运营端-用户管理
        'pages/admin/vehicles/index',          // 运营端-车辆审核
        'pages/admin/orders/index',            // 运营端-订单管理
        'pages/admin/commission/index',        // 运营端-佣金审核
        'pages/admin/stats/index',             // 运营端-数据统计
        'pages/admin/settings/index',          // 运营端-设置
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#1890ff',
        navigationBarTitleText: '无人车共享运营平台',
        navigationBarTextStyle: 'white'
      }
    }
