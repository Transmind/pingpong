# 乒乓球预定系统

微信小程序 + 微信云开发实现的乒乓球室管理系统。

## 功能特性

- **一键登录**: 微信授权快速登录
- **双日期 Tab**: 今天/明天快速切换
- **时间段预定**: 按小时粒度预定球台
- **房号管理**: 4 位数字房号锁定机制
- **自动滚存**: 每日自动将明天预定移至今天

## 项目结构

```
pingpong/
├── app.js                    # 全局逻辑
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── pages/
│   ├── login/                # 登录页
│   │   ├── login.wxml
│   │   ├── login.wxss
│   │   ├── login.js
│   │   └── login.json
│   └── booking/              # 预定页
│       ├── booking.wxml
│       ├── booking.wxss
│       ├── booking.js
│       └── booking.json
├── cloudFunctions/
│   ├── login/                # 获取 OpenID
│   ├── getBookings/          # 获取预定列表
│   ├── createBooking/        # 创建预定
│   ├── cancelBooking/        # 取消预定
│   └── rollover/             # 自动滚存
└── roll-over-trigger.json    # 云函数触发器配置
```

## 数据库结构

**集合名称**: `bookings`

| 字段 | 类型 | 说明 |
|------|------|------|
| date | String | 日期 (YYYY-MM-DD) |
| time_slot | String | 时间段 (HH:00) |
| room_number | String | 房号 (4 位数字) |
| openid | String | 用户 OpenID |
| avatarUrl | String | 用户头像 |
| userName | String | 用户昵称 |
| createTime | Date | 创建时间 |

## 开发步骤

1. 使用微信开发者工具导入本项目
2. 配置云开发环境 ID
3. 上传所有云函数
4. 创建 bookings 数据库集合
5. 配置定时触发器 (需在云控制台手动开启)

## 使用说明

### 登录
- 点击一键登录按钮
- 授权微信用户信息
- 自动跳转至预定页

### 预定
1. 选择今天或明天 Tab
2. 点击对应时间段
3. 输入 4 位房号
4. 点击预定按钮

### 取消预定
- 仅本人可取消自己的预定
- 点击取消按钮并确认

### 自动滚存
- 每日 00:00 自动执行
- 将明天预定移至今天
- 清空明天预定记录

## 注意事项

- 房号必须为 4 位数字
- 同一时间段只能预定一次
- 取消预定需本人操作
- 需确保云函数触发器已启用
