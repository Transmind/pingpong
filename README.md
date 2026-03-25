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
├── cloudfunctions/
│   ├── login/                # 获取 OpenID
│   ├── getBookings/          # 获取预定列表
│   ├── createBooking/        # 创建预定
│   ├── cancelBooking/        # 取消预定
│   └── rollover/
│       ├── config.json       # 云函数配置 + 触发器定义
│       ├── index.js          # 滚存逻辑
│       └── package.json      # 依赖配置
└── test-results/             # Playwright 测试结果
```

## 云函数触发器配置说明

定时触发器定义在 `cloudfunctions/rollover/config.json` 中：

```json
{
  "triggers": [
    {
      "name": "dailyRollover",
      "type": "timer",
      "config": "0 0 11 * * *",  // Cron 表达式：每天 11:00
      "function": "rollover"
    }
  ]
}
```

- **上传触发器**：右键点击 `config.json` → "上传并部署：云端安装依赖"
- **Cron 表达式格式**：`秒 分 时 日 月 周`
- **查看/管理触发器**：微信云开发控制台 → 触发器

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

## 部署方法

### 初次部署
1. 使用微信开发者工具导入本项目
2. 配置云开发环境 ID（在 `project.config.json` 中设置 `cloudid`）
3. 上传所有云函数：
   - 依次右键点击每个云函数目录下的 `config.json` 文件
   - 选择"上传并部署：云端安装依赖"
4. 创建 `bookings` 数据库集合

### 配置定时触发器（云函数自动滚存）
1. 打开 `cloudfunctions/rollover/config.json`
2. 右键点击该文件，选择"上传并部署：云端安装依赖"（同时会上传触发器配置）
3. 登录微信云开发控制台，进入 "触发器" 页面
4. 确认 `dailyRollover` 触发器已启用
   - 触发器配置：每天 11:00 执行
   - 如需修改执行时间，编辑 `config.json` 中的 `config` 字段（Cron 表达式格式）

### 后续更新
- 修改云函数代码后，右键点击对应 `config.json` 进行增量上传

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
- 每日 11:00 自动执行（可在云控制台修改或手动触发）
- 将明天预定移至今天
- 清空今天过期的预定记录

## 注意事项

- 房号必须为 4 位数字
- 每人或每户人家每天最多可预定3个小时
- 取消预定需本人操作
- 需确保云函数触发器已启用
