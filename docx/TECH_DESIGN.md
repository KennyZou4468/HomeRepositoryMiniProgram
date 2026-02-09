# 技术设计文档（Technical Design Document）
# 家庭物品管理微信小程序

**版本：** v1.0  
**文档日期：** 2026年2月9日  
**技术栈：** 微信小程序原生开发  

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────┐
│         微信小程序容器               │
├─────────────────────────────────────┤
│  UI层（WXML + WXSS）                │
│  ├── pages/index   (首页)           │
│  ├── pages/add     (新增)           │
│  ├── pages/detail  (详情)           │
│  └── pages/mine    (设置)           │
├─────────────────────────────────────┤
│  逻辑层（JavaScript）                │
│  ├── Page逻辑                       │
│  ├── 数据管理（utils/settings.js）  │
│  └── 主题管理（app.js）             │
├─────────────────────────────────────┤
│  数据层（Local Storage）             │
│  ├── home_items    (物品数据)       │
│  └── app_settings  (设置数据)       │
└─────────────────────────────────────┘
```

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生 | wxml + wxss + js |
| 数据存储 | wx.Storage API | 本地持久化存储 |
| 状态管理 | Page Data + Storage | 无第三方状态库 |
| 主题系统 | CSS变量 + 类名切换 | 支持深浅色模式 |
| 时间处理 | 原生JavaScript | Date对象 + 时间戳 |

### 1.3 目录结构

```
/
├── app.js                        // 小程序入口逻辑
├── app.json                      // 全局配置
├── app.wxss                      // 全局样式
├── project.config.json           // 项目配置
├── project.private.config.json   // 私有配置
├── README.md                     // 项目说明
│
├── utils/
│   └── settings.js               // 数据存储工具类
│
├── custom-tab-bar/               // 自定义TabBar组件
│   ├── index.js
│   ├── index.json
│   ├── index.wxml
│   └── index.wxss
│
├── images/                       // 图片资源
│
└── pages/
    ├── index/                    // 首页
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── add/                      // 新增页面
    │   ├── add.js
    │   ├── add.json
    │   ├── add.wxml
    │   └── add.wxss
    ├── detail/                   // 详情页面
    │   ├── detail.js
    │   ├── detail.json
    │   ├── detail.wxml
    │   └── detail.wxss
    └── mine/                     // 设置页面
        ├── mine.js
        ├── mine.json
        ├── mine.wxml
        └── mine.wxss
```

---

## 2. 数据模型设计

### 2.1 物品数据模型（Item）

**数据表：** `home_items`（本地存储Key）  
**数据类型：** Array<Item>

```typescript
interface Item {
  id: string;              // 唯一标识，格式：item_{timestamp}
  name: string;            // 物品名称，最多50字符
  location: string;        // 存放位置，必填
  count: number;           // 数量，默认1，不可小于0
  unit?: string;           // 单位，可选
  category?: string;       // 分类，可选
  note?: string;           // 备注，最多250字符
  createdAt: number;       // 创建时间戳（秒）
  updatedAt: number;       // 最近更新时间戳（秒）
  history?: HistoryRecord[]; // 库存变更记录，最多20条
}

interface HistoryRecord {
  delta: number;           // 变更数量（正数为增加，负数为减少）
  after: number;           // 变更后的数量
  time: number;            // 变更时间戳（秒）
}
```

**示例数据：**

```json
[
  {
    "id": "item_1707543210123",
    "name": "5号电池",
    "location": "客厅 / 电视柜 / 抽屉",
    "count": 8,
    "unit": "节",
    "category": "日用品",
    "note": "遥控器用",
    "createdAt": 1707543210,
    "updatedAt": 1707543500,
    "history": [
      {
        "delta": -2,
        "after": 8,
        "time": 1707543500
      }
    ]
  }
]
```

### 2.2 设置数据模型（Settings）

**数据表：** `app_settings`（本地存储Key）  
**数据类型：** Object

```typescript
interface Settings {
  theme: 'system' | 'light' | 'dark';  // 主题设置
  locations: string[];                  // 预设位置列表
  categories: string[];                 // 预设分类列表
}
```

**默认值：**

```json
{
  "theme": "system",
  "locations": ["客厅", "卧室", "厨房", "浴室"],
  "categories": ["日用品", "食品", "工具", "其他"]
}
```

---

## 3. 核心模块设计

### 3.1 数据管理模块（utils/settings.js）

#### 3.1.1 存储键定义

```javascript
const STORAGE_KEYS = {
  ITEMS: 'home_items',
  SETTINGS: 'app_settings'
}

const DEFAULT_SETTINGS = {
  theme: 'system',
  locations: ['客厅', '卧室', '厨房', '浴室'],
  categories: ['日用品', '食品', '工具', '其他']
}
```

#### 3.1.2 物品操作函数

```javascript
/**
 * 获取所有物品
 * @returns {Array<Item>}
 */
function getItems() {
  try {
    const items = wx.getStorageSync(STORAGE_KEYS.ITEMS)
    return items || []
  } catch (e) {
    console.error('获取物品失败', e)
    return []
  }
}

/**
 * 保存所有物品
 * @param {Array<Item>} items
 */
function saveItems(items) {
  try {
    wx.setStorageSync(STORAGE_KEYS.ITEMS, items)
  } catch (e) {
    console.error('保存物品失败', e)
    wx.showToast({ title: '保存失败', icon: 'none' })
  }
}

/**
 * 根据ID获取物品
 * @param {string} id
 * @returns {Item|null}
 */
function getItemById(id) {
  const items = getItems()
  return items.find(item => item.id === id) || null
}

/**
 * 添加物品
 * @param {Item} item
 */
function addItem(item) {
  const items = getItems()
  items.push(item)
  saveItems(items)
}

/**
 * 更新物品
 * @param {string} id
 * @param {Partial<Item>} updates
 */
function updateItem(id, updates) {
  const items = getItems()
  const index = items.findIndex(item => item.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...updates }
    saveItems(items)
  }
}

/**
 * 删除物品
 * @param {string} id
 */
function deleteItem(id) {
  const items = getItems()
  const filtered = items.filter(item => item.id !== id)
  saveItems(filtered)
}
```

#### 3.1.3 设置操作函数

```javascript
/**
 * 获取设置
 * @returns {Settings}
 */
function getSettings() {
  try {
    const settings = wx.getStorageSync(STORAGE_KEYS.SETTINGS)
    return settings || DEFAULT_SETTINGS
  } catch (e) {
    console.error('获取设置失败', e)
    return DEFAULT_SETTINGS
  }
}

/**
 * 保存设置
 * @param {Partial<Settings>} settings
 */
function saveSettings(settings) {
  const current = getSettings()
  const updated = { ...current, ...settings }
  try {
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, updated)
  } catch (e) {
    console.error('保存设置失败', e)
  }
}
```

#### 3.1.4 历史记录函数

```javascript
/**
 * 添加库存变更记录
 * @param {string} itemId
 * @param {number} delta - 变更数量
 */
function addHistoryRecord(itemId, delta) {
  const item = getItemById(itemId)
  if (!item) return
  
  const record = {
    delta: delta,
    after: item.count,
    time: getTimestamp()
  }
  
  const history = item.history || []
  history.unshift(record) // 添加到开头
  
  // 最多保留20条
  if (history.length > 20) {
    history.pop()
  }
  
  updateItem(itemId, { history })
}
```

#### 3.1.5 工具函数

```javascript
/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
  return `item_${Date.now()}`
}

/**
 * 获取当前时间戳（秒）
 * @returns {number}
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000)
}

/**
 * 格式化时间戳为可读字符串
 * @param {number} timestamp - 秒级时间戳
 * @returns {string} 格式：2026-02-09 15:30
 */
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 计算存储空间大小
 * @returns {string}
 */
function getStorageSize() {
  try {
    const info = wx.getStorageInfoSync()
    const sizeKB = info.currentSize
    if (sizeKB > 1024) {
      return `${(sizeKB / 1024).toFixed(2)} MB`
    }
    return `${sizeKB} KB`
  } catch (e) {
    return '0 KB'
  }
}
```

#### 3.1.6 导出

```javascript
module.exports = {
  // 物品操作
  getItems,
  saveItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  
  // 设置操作
  getSettings,
  saveSettings,
  
  // 历史记录
  addHistoryRecord,
  
  // 工具函数
  generateId,
  getTimestamp,
  formatTime,
  getStorageSize
}
```

---

### 3.2 主题管理模块

#### 3.2.1 app.js 实现

```javascript
// app.js
const { getSettings, saveSettings } = require('./utils/settings.js')

App({
  globalData: {
    theme: 'system',
    isDark: false
  },
  
  onLaunch() {
    this.initTheme()
    this.watchSystemTheme()
  },
  
  /**
   * 初始化主题
   */
  initTheme() {
    const settings = getSettings()
    this.applyTheme(settings.theme || 'system')
  },
  
  /**
   * 应用主题
   * @param {string} theme - 'system' | 'light' | 'dark'
   */
  applyTheme(theme) {
    this.globalData.theme = theme
    
    if (theme === 'system') {
      const systemInfo = wx.getSystemInfoSync()
      this.setThemeColor(systemInfo.theme === 'dark')
    } else {
      this.setThemeColor(theme === 'dark')
    }
  },
  
  /**
   * 设置主题颜色
   * @param {boolean} isDark
   */
  setThemeColor(isDark) {
    this.globalData.isDark = isDark
    
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      animation: {
        duration: 300,
        timingFunc: 'easeInOut'
      }
    })
    
    // 更新TabBar颜色
    wx.setTabBarStyle({
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderStyle: isDark ? 'white' : 'black',
      color: isDark ? '#888888' : '#999999',
      selectedColor: isDark ? '#3a86ff' : '#007aff'
    })
  },
  
  /**
   * 监听系统主题变化
   */
  watchSystemTheme() {
    wx.onThemeChange((res) => {
      if (this.globalData.theme === 'system') {
        this.setThemeColor(res.theme === 'dark')
      }
    })
  }
})
```

#### 3.2.2 页面主题应用

```javascript
// 在每个页面的 js 文件中
Page({
  data: {
    isDark: false
  },
  
  onLoad() {
    const app = getApp()
    this.setData({
      isDark: app.globalData.isDark
    })
  },
  
  onShow() {
    // 检查主题是否变化
    const app = getApp()
    if (this.data.isDark !== app.globalData.isDark) {
      this.setData({
        isDark: app.globalData.isDark
      })
    }
  }
})
```

#### 3.2.3 WXSS主题样式

```css
/* app.wxss */
page {
  --bg-color: #f5f5f5;
  --text-color: #333333;
  --card-bg: #ffffff;
  --border-color: #e0e0e0;
  --primary-color: #007aff;
}

page.theme-dark {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --card-bg: #2a2a2a;
  --border-color: #3a3a3a;
  --primary-color: #3a86ff;
}

.page {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
}
```

---

### 3.3 搜索模块

#### 3.3.1 搜索逻辑

```javascript
/**
 * 搜索物品
 * @param {Array<Item>} items - 物品列表
 * @param {string} keyword - 搜索关键词
 * @returns {Array<Item>}
 */
function searchItems(items, keyword) {
  if (!keyword || !keyword.trim()) {
    return items
  }
  
  const lowerKeyword = keyword.toLowerCase().trim()
  
  return items.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(lowerKeyword)
    const locationMatch = item.location.toLowerCase().includes(lowerKeyword)
    const noteMatch = item.note && item.note.toLowerCase().includes(lowerKeyword)
    
    return nameMatch || locationMatch || noteMatch
  })
}
```

#### 3.3.2 防抖优化（可选）

```javascript
/**
 * 防抖函数
 * @param {Function} fn
 * @param {number} delay
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 使用示例
Page({
  data: {
    searchKeyword: '',
    items: [],
    filteredItems: []
  },
  
  onLoad() {
    this.debouncedSearch = debounce(this.performSearch.bind(this), 300)
  },
  
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.debouncedSearch(keyword)
  },
  
  performSearch(keyword) {
    const filtered = searchItems(this.data.items, keyword)
    this.setData({ filteredItems: filtered })
  }
})
```

---

## 4. 页面实现细节

### 4.1 首页（pages/index/）

#### 4.1.1 index.js

```javascript
const { getItems } = require('../../utils/settings.js')

Page({
  data: {
    items: [],
    filteredItems: [],
    searchKeyword: '',
    isDark: false
  },
  
  onLoad() {
    const app = getApp()
    this.setData({ isDark: app.globalData.isDark })
  },
  
  onShow() {
    this.loadItems()
  },
  
  loadItems() {
    const items = getItems()
    this.setData({
      items,
      filteredItems: items
    })
  },
  
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.filterItems(keyword)
  },
  
  filterItems(keyword) {
    if (!keyword.trim()) {
      this.setData({ filteredItems: this.data.items })
      return
    }
    
    const lowerKeyword = keyword.toLowerCase()
    const filtered = this.data.items.filter(item =>
      item.name.toLowerCase().includes(lowerKeyword) ||
      item.location.toLowerCase().includes(lowerKeyword) ||
      (item.note && item.note.toLowerCase().includes(lowerKeyword))
    )
    
    this.setData({ filteredItems: filtered })
  },
  
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },
  
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  }
})
```

#### 4.1.2 index.wxml

```xml
<view class="page {{isDark ? 'theme-dark' : ''}}">
  <!-- 搜索栏 -->
  <view class="search-bar">
    <input
      class="search-input"
      type="text"
      placeholder="搜索物品名称、位置或备注"
      value="{{searchKeyword}}"
      bindinput="onSearchInput"
    />
  </view>
  
  <!-- 物品列表 -->
  <view class="item-list">
    <view
      wx:for="{{filteredItems}}"
      wx:key="id"
      class="item-card"
      data-id="{{item.id}}"
      bindtap="goToDetail"
    >
      <view class="item-name">{{item.name}}</view>
      <view class="item-location">📍 {{item.location}}</view>
      <view class="item-count {{item.count <= 2 ? 'low-stock' : ''}}">
        {{item.count}} {{item.unit || ''}}
      </view>
    </view>
    
    <!-- 空状态 -->
    <view wx:if="{{filteredItems.length === 0}}" class="empty-state">
      <text class="empty-icon">🏡</text>
      <text class="empty-text">家里还没有记录物品哦～</text>
      <text class="empty-hint">先加一个吧，让生活更有条理 ✨</text>
    </view>
  </view>
  
  <!-- 新增按钮 -->
  <view class="add-button" bindtap="goToAdd">
    ＋ 添加物品
  </view>
</view>
```

#### 4.1.3 index.wxss

```css
.page {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-bottom: 100rpx;
}

.search-bar {
  position: sticky;
  top: 0;
  padding: 20rpx;
  background-color: var(--bg-color);
  z-index: 100;
}

.search-input {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
  font-size: 28rpx;
}

.item-list {
  padding: 0 20rpx;
}

.item-card {
  background-color: var(--card-bg);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.item-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10rpx;
}

.item-location {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 10rpx;
}

.item-count {
  font-size: 28rpx;
  color: var(--primary-color);
  font-weight: 600;
}

.item-count.low-stock {
  color: #ff9500;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: var(--text-color);
  display: block;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #888;
  display: block;
}

.add-button {
  position: fixed;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--primary-color);
  color: white;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  font-size: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0,122,255,0.3);
}
```

---

### 4.2 详情页（pages/detail/）

#### 4.2.1 detail.js（核心逻辑）

```javascript
const { getItemById, updateItem, deleteItem, addHistoryRecord } = require('../../utils/settings.js')

Page({
  data: {
    item: null,
    initialCount: 0,  // 进入页面时的初始数量
    noteExpanded: false,
    isDark: false
  },
  
  onLoad(options) {
    const item = getItemById(options.id)
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    const app = getApp()
    this.setData({
      item,
      initialCount: item.count,
      isDark: app.globalData.isDark
    })
  },
  
  /**
   * 离开页面时记录库存变更
   */
  onUnload() {
    const delta = this.data.item.count - this.data.initialCount
    if (delta !== 0) {
      addHistoryRecord(this.data.item.id, delta)
    }
  },
  
  /**
   * 增加数量
   */
  onIncrease() {
    const count = this.data.item.count + 1
    this.updateCount(count)
  },
  
  /**
   * 减少数量
   */
  onDecrease() {
    if (this.data.item.count > 0) {
      const count = this.data.item.count - 1
      this.updateCount(count)
    } else {
      wx.showToast({ title: '数量不能小于0', icon: 'none' })
    }
  },
  
  /**
   * 更新数量
   */
  updateCount(count) {
    const item = { ...this.data.item, count }
    this.setData({ item })
    
    const timestamp = Math.floor(Date.now() / 1000)
    updateItem(item.id, { count, updatedAt: timestamp })
  },
  
  /**
   * 展开/收起备注
   */
  toggleNote() {
    this.setData({
      noteExpanded: !this.data.noteExpanded
    })
  },
  
  /**
   * 编辑物品
   */
  onEdit() {
    // 跳转到编辑页面（复用add页面）
    wx.navigateTo({
      url: `/pages/add/add?id=${this.data.item.id}`
    })
  },
  
  /**
   * 删除物品
   */
  onDelete() {
    wx.showModal({
      title: '提示',
      content: '确定要删除这个物品吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          deleteItem(this.data.item.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})
```

---

## 5. 性能优化

### 5.1 存储优化

- 定期清理超过20条的历史记录
- 压缩备注字段（最多250字符）
- 监控存储空间使用量

### 5.2 渲染优化

- 列表使用 `wx:key` 避免重复渲染
- 搜索使用防抖（debounce）
- 主题切换使用CSS变量

### 5.3 数据操作优化

- 批量操作合并写入
- 避免频繁的 `setStorageSync`
- 使用缓存减少读取次数

---

## 6. 错误处理

### 6.1 存储错误

```javascript
try {
  wx.setStorageSync(key, value)
} catch (e) {
  if (e.errMsg.includes('exceed')) {
    wx.showModal({
      title: '存储空间不足',
      content: '请清理部分数据后重试'
    })
  } else {
    wx.showToast({ title: '保存失败', icon: 'none' })
  }
}
```

### 6.2 数据验证

```javascript
function validateItem(item) {
  if (!item.name || !item.name.trim()) {
    throw new Error('物品名称不能为空')
  }
  if (!item.location || !item.location.trim()) {
    throw new Error('存放位置不能为空')
  }
  if (item.count < 0) {
    throw new Error('数量不能小于0')
  }
  if (item.note && item.note.length > 250) {
    throw new Error('备注不能超过250字符')
  }
}
```

---

## 7. 测试策略

### 7.1 单元测试（可选）

- 工具函数测试（utils/settings.js）
- 数据验证测试
- 时间格式化测试

### 7.2 功能测试

- ✅ 新增物品
- ✅ 编辑物品
- ✅ 删除物品
- ✅ 搜索功能
- ✅ 库存变更记录
- ✅ 主题切换
- ✅ 存储管理

### 7.3 边界测试

- 空列表状态
- 存储空间满
- 数量为0
- 备注超长
- 特殊字符输入

---

## 8. 部署与发布

### 8.1 发布前检查

- [ ] 删除所有 console.log
- [ ] 检查敏感信息（appid等）
- [ ] 压缩图片资源
- [ ] 测试深浅色主题
- [ ] 测试真机兼容性

### 8.2 版本管理

- v1.0.0 - 初始版本
- 后续版本遵循语义化版本规范

---

## 9. 扩展性设计

### 9.1 为未来预留的接口

```javascript
// 云同步接口（预留）
async function syncToCloud(items) {
  // 暂未实现
  return Promise.resolve()
}

// 图片上传接口（预留）
async function uploadImage(filePath) {
  // 暂未实现
  return Promise.resolve('')
}
```

### 9.2 数据迁移方案

```javascript
function migrateData(oldVersion, newVersion) {
  const items = getItems()
  
  // 根据版本号进行数据迁移
  if (oldVersion < 1.1) {
    // 添加新字段
    items.forEach(item => {
      if (!item.history) {
        item.history = []
      }
    })
    saveItems(items)
  }
}
```

---

## 10. 附录

### 10.1 微信小程序API参考

- [wx.setStorageSync](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html)
- [wx.getStorageSync](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.getStorageSync.html)
- [wx.onThemeChange](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.onThemeChange.html)

### 10.2 开发工具

- 微信开发者工具 v1.06+
- VS Code + 小程序插件

---

**文档状态：** 已完成  
**维护人：** 技术团队  
**最后更新：** 2026-02-09
