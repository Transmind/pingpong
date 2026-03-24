const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { date } = event
  
  try {
    const res = await db.collection('bookings')
      .where({
        date: date
      })
      .orderBy('time_slot', 'asc')
      .get()
    
    return {
      success: true,
      bookings: res.data
    }
  } catch (err) {
    console.error('获取预定列表失败:', err)
    return {
      success: false,
      message: '获取预定列表失败'
    }
  }
}
