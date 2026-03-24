const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { date, time_slot, openid } = event
  
  console.log('[cancelBooking] 接收参数:', { date, time_slot, openid })
  
  if (!date || !time_slot || !openid) {
    console.error('[cancelBooking] 参数缺失:', { date: !!date, time_slot: !!time_slot, openid: !!openid })
    return {
      success: false,
      message: '参数缺失，无法取消预定'
    }
  }
  
  try {
    // 查找预定记录
    const res = await db.collection('bookings')
      .where({
        date: date,
        time_slot: time_slot
      })
      .get()
    
    console.log('[cancelBooking] 查询结果:', res.data)
    
    if (res.data.length === 0) {
      console.error('[cancelBooking] 未找到预定记录:', { date, time_slot })
      return {
        success: false,
        message: '未找到预定记录'
      }
    }
    
    const booking = res.data[0]
    console.log('[cancelBooking] 找到的记录:', { bookingId: booking._id, bookingOpenid: booking.openid, requestOpenid: openid })
    
    // 校验是否为本人预定
    if (booking.openid !== openid) {
      console.error('[cancelBooking] 权限校验失败：只能取消自己的预定')
      return {
        success: false,
        message: '只能取消自己的预定'
      }
    }
    
    // 删除预定
    console.log('[cancelBooking] 正在删除记录 ID:', booking._id)
    await db.collection('bookings')
      .doc(booking._id)
      .remove()
    
    console.log('[cancelBooking] 删除成功')
    
    return {
      success: true
    }
  } catch (err) {
    console.error('[cancelBooking] 执行失败:', err)
    return {
      success: false,
      message: '取消预定失败：' + err.message
    }
  }
}
