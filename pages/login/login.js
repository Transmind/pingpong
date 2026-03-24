const app = getApp()

Page({
  data: {
    isLoggingIn: false,
    showAvatarModal: false,
    tempAvatarUrl: '',
    tempUserInfo: null
  },

  // 头像选择回调
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    console.log('[登录页] 用户选择头像:', avatarUrl)
    
    this.setData({
      tempAvatarUrl: avatarUrl
    })
    
    // 仅更新预览，等待用户点击确认按钮
  },

  // 确认头像并继续登录流程
  async confirmAvatar() {
    if (!this.data.tempAvatarUrl) {
      wx.showToast({
        title: '请先选择头像',
        icon: 'none'
      })
      return
    }
    
    // 直接使用微信昵称（即使是"微信用户"）
    const wechatNickname = this.data.tempUserInfo.nickName || '微信用户'
    
    // 上传头像到云存储
    this.setData({ isLoggingIn: true })
    
    try {
      const fileName = `avatars/${this.data.tempUserInfo.openId}_${Date.now()}.png`
      
      console.log('[登录页] 开始上传头像到云存储:', fileName)
      
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: this.data.tempAvatarUrl
      })
      
      console.log('[登录页] 头像上传成功:', uploadRes.fileID)
      
      // 更新用户信息中的头像和昵称
      const userInfo = { ...this.data.tempUserInfo }
      userInfo.avatarUrl = uploadRes.fileID
      userInfo.nickName = wechatNickname // 直接使用微信昵称
      
      // 存入全局数据
      app.globalData.userInfo = userInfo
      app.globalData.openId = this.data.tempUserInfo.openId
      app.globalData.isLoggedIn = true
      
      // 本地缓存
      wx.setStorageSync('loginInfo', {
        userInfo: userInfo,
        openId: this.data.tempUserInfo.openId
      })
      
      console.log('[登录页] 登录成功，用户信息已保存:', userInfo)
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000
      })
      
      // 跳转至预定页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/booking/booking'
        })
      }, 2000)
      
    } catch (err) {
      console.error('[登录页] 头像上传失败:', err)
      wx.showToast({
        title: '头像上传失败，请重试',
        icon: 'none'
      })
      this.setData({ 
        isLoggingIn: false,
        showAvatarModal: true 
      })
    }
  },

  async handleLogin() {
    if (this.data.isLoggingIn) return
    
    this.setData({ isLoggingIn: true })
    
    try {
      // 第一步：获取用户授权（获取昵称和临时头像）
      console.log('[登录] 开始获取用户授权...')
      
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      const userInfo = userInfoRes.userInfo
      
      console.log('[登录] 获取到的用户信息:', userInfo)
      
      // 验证用户信息有效性
      if (!userInfo || !userInfo.avatarUrl) {
        console.error('[登录] 用户信息不完整:', userInfo)
        wx.showModal({
          title: '授权失败',
          content: '未能获取到用户头像，请检查微信版本或网络',
          showCancel: false
        })
        this.setData({ isLoggingIn: false })
        return
      }
      
      // 第二步：获取 OpenID
      const openIdRes = await wx.cloud.callFunction({
        name: 'login'
      })
      
      const openId = openIdRes.result.openId
      
      // 保存临时信息（含 openId）
      const tempUserInfo = {
        ...userInfo,
        openId: openId
      }
      
      this.setData({
        tempUserInfo,
        isLoggingIn: false,
        showAvatarModal: true
      })
      
      console.log('[登录] 等待用户选择头像...')
      
    } catch (err) {
      console.error('[登录] 登录失败:', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      this.setData({ isLoggingIn: false })
    }
  }
})
