const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { date, time_slot, room_number, openid, avatarUrl, userName } = event
  
  console.log('[createBooking] 接收参数:', { date, time_slot, room_number, openid, avatarUrl, userName })
  
  if (!avatarUrl || !userName) {
    console.error('[createBooking] 缺少用户信息：avatarUrl 或 userName 为空')
    return {
      success: false,
      message: '用户信息缺失，请重新登录后再试'
    }
  }
  
  try {
    // 检查该时间段是否已被预定
    const existing = await db.collection('bookings')
      .where({
        date: date,
        time_slot: time_slot
      })
      .get()
    
    if (existing.data.length > 0) {
      return {
        success: false,
        message: '该时间段已被预定'
      }
    }
    
    // 原子查询 1：检查该房号当天已预定的次数
    const dailyRoomBookings = await db.collection('bookings')
      .where({
        date: date,
        room_number: room_number
      })
      .count()
    
    if (dailyRoomBookings.total >= 3) {
      return {
        success: false,
        message: '每户每天最多可预定 3 个小时'
      }
    }
    
    // 原子查询 2：检查该用户当天已预定的时段数
    const dailyUserBookings = await db.collection('bookings')
      .where({
        date: date,
        openid: openid
      })
      .count()
    
    if (dailyUserBookings.total >= 3) {
      return {
        success: false,
        message: '每人在一天内不可占用超过 3 个时段'
      }
    }
    
    // 创建新预定，统一使用 avatarUrl 和 userName 字段
    const res = await db.collection('bookings').add({
      data: {
        date: date,
        time_slot: time_slot,
        room_number: room_number,
        openid: openid,
        avatarUrl: avatarUrl,
        userName: userName,
        createTime: db.serverDate()
      }
    })
    
    console.log('[createBooking] 预定成功，记录 ID:', res._id)
    
    return {
      success: true,
      bookingId: res._id
    }
  } catch (err) {
    console.error('[createBooking] 创建失败:', err)
    return {
      success: false,
      message: '创建预定失败'
    }
  }
}
