const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const now = new Date()
    
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const todayStr = formatDate(now)
    
    // 计算后天日期
    const dayAfterTomorrow = new Date(now)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    const dayAfterTomorrowStr = formatDate(dayAfterTomorrow)
    
    // 步骤 1: 删除今天的所有记录（今天已过期）
    const todayBookings = await db.collection('bookings')
      .where({
        date: todayStr
      })
      .get()
    
    if (todayBookings.data.length > 0) {
      await db.collection('bookings')
        .where({
          date: todayStr
        })
        .remove()
    }
    
    // 步骤 2: 初始化后天的记录（清空后天数据，确保只保留今天和明天）
    const dayAfterTomorrowBookings = await db.collection('bookings')
      .where({
        date: dayAfterTomorrowStr
      })
      .get()
    
    if (dayAfterTomorrowBookings.data.length > 0) {
      await db.collection('bookings')
        .where({
          date: dayAfterTomorrowStr
        })
        .remove()
    }
    
    // 步骤 3: 可选：检查明天是否有数据，如果没有则提示（但不过度干预）
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = formatDate(tomorrow)
    
    const tomorrowBookings = await db.collection('bookings')
      .where({
        date: tomorrowStr
      })
      .get()
    
    return {
      success: true,
      message: `清理完成：删除了 ${todayStr} 的 ${todayBookings.data.length} 条记录，清空了 ${dayAfterTomorrowStr} 的 ${dayAfterTomorrowBookings.data.length} 条记录`,
      details: {
        deletedToday: todayBookings.data.length,
        deletedDayAfterTomorrow: dayAfterTomorrowBookings.data.length,
        tomorrowCount: tomorrowBookings.data.length
      }
    }
  } catch (err) {
    console.error('清理失败:', err)
    return {
      success: false,
      message: '清理失败：' + err.message
    }
  }
}
