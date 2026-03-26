# 乒乓球预定系统

微信小程序 + 微信云开发实现的乒乓球室管理系统。

## 功能特性

- **一键登录**: 微信授权快速登录
- **双日期 Tab**: 今天/明天快速切换
- **时间段预定**: 按小时粒度预定球台
- **房号管理**: 4 位数字房号锁定机制
- **自动清理**: 每日 23:30 自动删除今天的记录，并初始化后天的预定记录

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
├── cloudfunctions/
│   ├── login/                # 获取 OpenID
│   ├── getBookings/          # 获取预定列表
│   ├── createBooking/        # 创建预定
│   ├── cancelBooking/        # 取消预定
│   └── rollover/
│       ├── config.json       # 云函数配置 + 触发器定义
│       ├── index.js          # 滚存逻辑
│       └── package.json      # 依赖配置
```


## 云函数触发器配置说明

定时触发器定义在 `cloudfunctions/rollover/config.json` 中：

```json
{
  "triggers": [
    {
      "name": "dailyRollover",
      "type": "timer",
      "config": "0 30 23 * * *",  // Cron 表达式：每天 23:30
      "function": "rollover"
    }
  ]
}
```

- **上传触发器**：右键点击 `config.json` → "上传并部署：云端安装依赖"
- **Cron 表达式格式**：`秒 分 时 日 月 周`


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
5. 配置定时触发器

## 部署方法

### 初次部署
1. 使用微信开发者工具导入本项目
2. 配置云开发环境 ID（在 `project.config.json` 中设置 `cloudid`）
3. 上传所有云函数：
   - 依次右键点击每个云函数目录，选择"上传并部署：云端安装依赖"
4. 创建 `bookings` 数据库集合

### 配置定时触发器（云函数自动清理）
1. 打开 `cloudfunctions/rollover/config.json`
2. 右键点击该文件，选择上传触发器
3. 登录微信云开发控制台，确认触发器已启用
   - 触发器配置：每天 23:30 执行
   - 如需修改执行时间，编辑 `config.json` 中的 `config` 字段（Cron 表达式格式：`秒 分 时 日 月 周`），并重新上传

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

### 自动清理机制
- 每日 23:30 自动执行（可在云控制台修改或手动触发）
- 删除今天的预定记录
- 清空后天的预定记录（确保只保留今天和明天两天）
- 到了 0:00，原来的"明天"自动变成"今天"，原有的预定数据自然显示在新的"今天" Tab 中

## 注意事项

- 房号必须为 4 位数字
- 每人或每户人家每天最多可预定3个小时
- 取消预定需本人操作
- 需确保云函数触发器已启用
- **数据保留策略**：数据库只保留"今天"和"明天"两天的预定记录，每日 23:30 自动清理
