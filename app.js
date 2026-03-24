App({
  globalData: {
    userInfo: null,
    openId: null,
    isLoggedIn: false
  },

  onLaunch() {
    console.log('乒乓球预定系统启动');

    /**
     * [重要] 初始化云开发环境
     * traceUser: true 将记录用户访问记录，方便在后台查看
     * env: '你的环境ID' (建议显式填写，防止 IDE 默认指向错误)
     */
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-7g3vveqb2e72db9d', // 请在此处填入你微信云开发控制台的“环境ID”
        traceUser: true,
      });
    }

    // 检查本地缓存是否已登录
    const loginInfo = wx.getStorageSync('loginInfo');
    if (loginInfo) {
      this.globalData.userInfo = loginInfo.userInfo;
      this.globalData.openId = loginInfo.openId;
      this.globalData.isLoggedIn = true;
    }
  }
})