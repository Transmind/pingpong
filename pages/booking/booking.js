const app = getApp()

// 生成时间槽 (08:00 - 22:00)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
    slots.push({
      time: startTime,
      timeLabel: `${startTime}～${endTime}`,
      status: 'available' // available | booked
    })
  }
  return slots
}

Page({
  data: {
    userInfo: null,
    openId: null,
    currentTab: 0, // 0 = 今天, 1 = 明天
    todayDate: '',
    tomorrowDate: '',
    timeSlots: [],
    roomInput: {},
    myBookedRooms: [], // 存储用户当天已预定的房号列表
    isLoading: false
  },

  onLoad() {
    if (!app.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    // 从全局数据或本地缓存获取用户信息
    let userInfo = app.globalData.userInfo
    let openId = app.globalData.openId
    
    // 如果全局数据为空，尝试从本地缓存读取
    if (!userInfo || !userInfo.avatarUrl || !userInfo.nickName) {
      console.log('[预定页] 全局用户信息缺失，尝试从本地缓存读取...')
      const cached = wx.getStorageSync('loginInfo')
      if (cached && cached.userInfo) {
        userInfo = cached.userInfo
        openId = cached.openId
        // 更新全局数据
        app.globalData.userInfo = userInfo
        app.globalData.openId = openId
        console.log('[预定页] 已从本地缓存恢复用户信息:', userInfo)
      } else {
        console.error('[预定页] 用户信息完全缺失，跳转登录')
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
    }
    
    // 验证用户信息完整性
    if (!userInfo.nickName || userInfo.nickName === '微信用户') {
      console.warn('[预定页] 检测到默认昵称 "微信用户"，将尝试从服务器重新加载或提示用户')
    }
    
    this.setData({
      userInfo: userInfo,
      openId: openId
    })
    
    console.log('[预定页] 用户信息已加载:', userInfo)
    
    this.initDates()
    this.loadBookings()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadBookings()
  },

  initDates() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const formatDate = (date) => {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    this.setData({
      todayDate: formatDate(today),
      tomorrowDate: formatDate(tomorrow)
    })
  },

  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    // Tab 切换时清空所有输入
    this.setData({ 
      roomInput: {},
      currentTab: tab 
    })
    this.loadBookings()
  },

  onRoomInput(e) {
    const time = e.currentTarget.dataset.time
    const value = e.detail.value
    
    // 限制只能输入数字
    if (!/^\d*$/.test(value)) {
      wx.showToast({
        title: '只能输入数字',
        icon: 'none'
      })
      return
    }
    
    // 实时校验：长度必须为 4 位
    if (value.length > 0 && value.length !== 4) {
      wx.showToast({
        title: '房号必须是 4 位数字',
        icon: 'none'
      })
    }
    
    // 焦点切换即重置：清空其他所有时段的输入
    const roomInput = { ...this.data.roomInput }
    for (const t in roomInput) {
      if (t !== time && this.data.timeSlots.find(s => s.time === t && s.status === 'available')) {
        roomInput[t] = ''  // 只清空未预定时段
      }
    }
    roomInput[time] = value
    this.setData({ roomInput })
  },

  async bookSlot(e) {
    const time = e.currentTarget.dataset.time
    const roomNumber = this.data.roomInput[time]
    
    // 校验用户信息是否存在
    if (!this.data.userInfo || !this.data.userInfo.avatarUrl || !this.data.userInfo.nickName) {
      wx.showModal({
        title: '登录失效',
        content: '用户信息缺失，请重新登录',
        showCancel: false,
        success: () => {
          wx.reLaunch({ url: '/pages/login/login' })
        }
      })
      // 清空输入
      const roomInput = { ...this.data.roomInput }
      roomInput[time] = ''
      this.setData({ roomInput })
      return
    }
    
    // 校验房号
    if (!roomNumber || roomNumber.length !== 4) {
      wx.showToast({
        title: '请输入 4 位房号',
        icon: 'none'
      })
      return
    }
    
    // 校验是否为纯数字
    if (!/^\d{4}$/.test(roomNumber)) {
      wx.showToast({
        title: '房号必须是 4 位数字',
        icon: 'none'
      })
      return
    }
    
    // 本地频次自检 1：检查当天该房号已预定的次数
    const todayRoomBookings = this.data.timeSlots.filter(slot => 
      slot.status === 'booked' && slot.roomNumber === roomNumber
    )
    
    if (todayRoomBookings.length >= 3) {
      wx.showToast({
        title: '每户每天最多可预定 3 个小时',
        icon: 'none'
      })
      // 清空该时段的房号输入，UI 复位
      const roomInput = { ...this.data.roomInput }
      roomInput[time] = ''
      this.setData({ roomInput })
      return
    }
    
    // 本地频次自检 2：检查用户当天已预定的时段数
    const myTodayBookings = this.data.timeSlots.filter(slot => 
      slot.status === 'booked' && slot.isMine
    )
    
    if (myTodayBookings.length >= 3) {
      wx.showModal({
        title: '无法预定',
        content: '每人在一天内不可占用超过 3 个时段',
        showCancel: false
      })
      // 清空该时段的房号输入，UI 复位
      const roomInput = { ...this.data.roomInput }
      roomInput[time] = ''
      this.setData({ roomInput })
      return
    }
    
    this.setData({ isLoading: true })
    
    try {
      const targetDate = this.data.currentTab === 0 
        ? this.getFormattedDate(new Date())
        : this.getFormattedDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
      
      console.log('[预定] 提交参数:', {
        date: targetDate,
        time_slot: time,
        room_number: roomNumber,
        openid: this.data.openId,
        avatarUrl: this.data.userInfo.avatarUrl,
        nickName: this.data.userInfo.nickName
      })
      
      // 调用云函数创建预定，传递真实用户信息
      const res = await wx.cloud.callFunction({
        name: 'createBooking',
        data: {
          date: targetDate,
          time_slot: time,
          room_number: roomNumber,
          openid: this.data.openId,
          avatarUrl: this.data.userInfo.avatarUrl,  // 真实彩色头像
          userName: this.data.userInfo.nickName     // 真实昵称
        }
      })
      
      console.log('[预定] 云函数返回:', res.result)
      
      if (res.result.success) {
        wx.showToast({
          title: '预定成功',
          icon: 'success'
        })
        // 不清空房号输入，而是锁定该房号状态
        // 记录用户新预定的房号到持久化列表
        const myBookedRooms = [...this.data.myBookedRooms]
        if (!myBookedRooms.includes(roomNumber)) {
          myBookedRooms.push(roomNumber)
        }
        this.setData({ myBookedRooms })
        this.loadBookings()
      } else {
        wx.showToast({
          title: res.result.message || '预定失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('[预定] 网络错误:', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  async cancelBooking(e) {
    const time = e.currentTarget.dataset.time
    
    // 调试：检查 time 是否存在
    if (!time) {
      console.error('[取消预定] 错误：time 参数为空，无法发起取消请求')
      wx.showToast({
        title: '取消失败：时段信息缺失',
        icon: 'none'
      })
      return
    }
    
    console.log('[取消预定] 准备取消时段:', time, '日期:', this.data.currentTab === 0 ? '今天' : '明天')
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个预定吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true })
          
          try {
            const targetDate = this.data.currentTab === 0 
              ? this.getFormattedDate(new Date())
              : this.getFormattedDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
            
            console.log('[取消预定] 调用云函数，参数:', { date: targetDate, time_slot: time, openid: this.data.openId })
            
            const result = await wx.cloud.callFunction({
              name: 'cancelBooking',
              data: {
                date: targetDate,
                time_slot: time,
                openid: this.data.openId
              }
            })
            
            console.log('[取消预定] 云函数返回:', result.result)
            
            if (result.result.success) {
              wx.showToast({
                title: '取消成功',
                icon: 'success'
              })
              // 显式清空该时段的 roomInput，确保 UI 彻底复位
              const roomInput = { ...this.data.roomInput }
              delete roomInput[time]  // 修正：使用 time 而不是 targetTime
              this.setData({ roomInput })
              this.loadBookings()
            } else {
              wx.showToast({
                title: result.result.message || '取消失败',
                icon: 'none'
              })
            }
          } catch (err) {
            console.error('[取消预定] 网络或执行错误:', err)
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
          } finally {
            this.setData({ isLoading: false })
          }
        }
      }
    })
  },

  async loadBookings() {
    this.setData({ isLoading: true })
    
    try {
      const targetDate = this.data.currentTab === 0 
        ? this.getFormattedDate(new Date())
        : this.getFormattedDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
      
      const res = await wx.cloud.callFunction({
        name: 'getBookings',
        data: { date: targetDate }
      })
      
      const bookings = res.result.bookings || []
      
      console.log('[加载预定] 服务器返回:', bookings.length, '条记录')
      
      // 更新用户已预定的房号列表（从服务器数据同步）
      const myBookedRooms = bookings
        .filter(b => b.openid === this.data.openId)
        .map(b => b.room_number)
      
      // 合并时间槽和预定信息（兼容新旧字段名）
      const timeSlots = generateTimeSlots().map(slot => {
        const booking = bookings.find(b => b.time_slot === slot.time)
        if (booking) {
          // 调试：输出每个预定的头像信息
          console.log('[加载预定] 时段', slot.time, '用户:', booking.nickName || booking.userName, '头像:', booking.userAvatar || booking.avatarUrl)
          
          // 调试：输出每个预定的用户信息
          const finalUserName = booking.nickName || booking.userName || '未知用户'
          const finalUserAvatar = booking.userAvatar || booking.avatarUrl || ''
          console.log('[加载预定] 时段', slot.time, '用户:', finalUserName, '头像:', finalUserAvatar)
          
          return {
            ...slot,
            status: 'booked',
            roomNumber: booking.room_number,
            isMine: booking.openid === this.data.openId,
            // 统一使用 avatarUrl 和 userName 用于 UI 渲染，同时保留原始字段
            avatarUrl: finalUserAvatar,
            userName: finalUserName,
            // 保留原始数据以供调试
            _rawNickName: booking.nickName,
            _rawUserName: booking.userName,
            _rawUserAvatar: booking.userAvatar,
            _rawAvatarUrl: booking.avatarUrl
          }
        }
        return slot
      })
      
      console.log('[加载预定] UI 渲染数据:', timeSlots.filter(s => s.status === 'booked').length, '个已预定')
      
      this.setData({ timeSlots, myBookedRooms })
    } catch (err) {
      console.error('[加载预定] 加载失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  getFormattedDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 头像加载错误处理
  onAvatarLoadError(e) {
    const { src } = e.currentTarget.dataset
    console.warn('[头像加载失败]', src)
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地缓存
          wx.removeStorageSync('loginInfo')
          
          // 清除全局数据
          app.globalData.userInfo = null
          app.globalData.openId = null
          app.globalData.isLoggedIn = false
          
          // 跳转回登录页
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  }
})
