const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const todayStr = formatDate(today)
    const tomorrowStr = formatDate(tomorrow)
    
    // 步骤 1: 先获取明天的预定记录
    const tomorrowBookings = await db.collection('bookings')
      .where({
        date: tomorrowStr
      })
      .get()
    
    // 步骤 2: 清空今天的预定（今天已过期）
    await db.collection('bookings')
      .where({
        date: todayStr
      })
      .remove()
    
    // 步骤 3: 将明天的记录移到今天
    const updates = tomorrowBookings.data.map(async (booking) => {
      // 删除明天的记录
      await db.collection('bookings').doc(booking._id).remove()
      
      // 创建今天的记录
      return db.collection('bookings').add({
        data: {
          date: todayStr,
          time_slot: booking.time_slot,
          room_number: booking.room_number,
          openid: booking.openid,
          avatarUrl: booking.avatarUrl,
          userName: booking.userName,
          createTime: db.serverDate()
        }
      })
    })
    
    if (updates.length > 0) {
      await Promise.all(updates)
    }
    
    return {
      success: true,
      message: `滚存完成：${tomorrowBookings.data.length} 条记录已滚存至今天`
    }
  } catch (err) {
    console.error('滚存失败:', err)
    return {
      success: false,
      message: '滚存失败: ' + err.message
    }
  }
}
