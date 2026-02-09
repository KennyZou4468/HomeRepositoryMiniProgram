# AI代理开发指令文档
# 家庭物品管理微信小程序

> **文档目的**：为AI编程助手（如GitHub Copilot、Claude等）提供完整的开发上下文和指令，确保代码生成符合项目要求。

---

## 🎯 项目概览

你正在开发一个**微信小程序**，用于帮助家庭用户管理物品的存放位置和库存数量。

**关键特征：**
- ✅ 原生微信小程序开发（wxml + wxss + js）
- ✅ 使用本地存储（wx.setStorageSync/getStorageSync）
- ✅ 无后端服务器，无云数据库
- ✅ 单用户模式
- ✅ 支持深浅色主题

---

## 📁 项目结构

```
/
├── app.js                        // 小程序入口
├── app.json                      // 全局配置
├── app.wxss                      // 全局样式
├── project.config.json           // 项目配置
├── utils/
│   └── settings.js               // 数据存储工具函数
├── custom-tab-bar/               // 自定义TabBar
│   ├── index.js
│   ├── index.wxml
│   └── index.wxss
└── pages/
    ├── index/                    // 首页：物品列表 + 搜索
    ├── add/                      // 新增物品页
    ├── detail/                   // 物品详情页
    └── mine/                     // 我的：设置管理
```

---

## 📊 数据结构

### 1. 物品数据（Item）

**Storage Key:** `home_items`  
**数据类型:** Array

```javascript
{
  id: "item_170000000001",      // 唯一ID（字符串）
  name: "5号电池",               // 物品名称（必填）
  location: "客厅 / 电视柜 / 抽屉", // 存放位置（必填）
  count: 8,                      // 数量（默认1）
  unit: "节",                    // 单位（可选）
  category: "日用品",            // 分类（可选）
  note: "遥控器用",              // 备注（可选，最多250字符）
  createdAt: 1700000000,         // 创建时间戳（秒）
  updatedAt: 1700000500,         // 更新时间戳（秒）
  history: [                     // 库存变更记录（可选，最多20条）
    {
      delta: -2,                 // 变更数量（+ / -）
      after: 6,                  // 变更后数量
      time: 1700000600           // 时间戳（秒）
    }
  ]
}
```

### 2. 设置数据（Settings）

**Storage Key:** `app_settings`

```javascript
{
  theme: 'system',              // 主题：'system' | 'light' | 'dark'
  locations: ['客厅', '卧室'],   // 预设位置列表
  categories: ['日用品', '食品'] // 预设分类列表
}
```

---

## 🔧 核心工具函数（utils/settings.js）

**必须实现的工具函数：**

```javascript
// 获取所有物品
function getItems()

// 保存所有物品
function saveItems(items)

// 获取单个物品
function getItemById(id)

// 添加物品
function addItem(item)

// 更新物品
function updateItem(id, updates)

// 删除物品
function deleteItem(id)

// 获取设置
function getSettings()

// 保存设置
function saveSettings(settings)

// 添加库存变更记录
function addHistoryRecord(itemId, delta)

// 生成唯一ID
function generateId()

// 获取当前时间戳（秒）
function getTimestamp()

// 计算存储空间
function getStorageSize()
```

**实现要点：**
- 所有读写操作使用 `wx.getStorageSync` 和 `wx.setStorageSync`
- ID格式：`item_` + 13位时间戳
- 时间戳使用秒级（Math.floor(Date.now() / 1000)）
- history数组最多保留20条，超出则删除最旧记录

---

## 📱 页面开发指令

### Page 1: 首页（pages/index/）

**功能：**
1. 展示物品列表
2. 搜索功能（实时过滤）
3. 跳转新增/详情页

**关键代码逻辑：**

```javascript
// index.js
Page({
  data: {
    items: [],           // 物品列表
    filteredItems: [],   // 过滤后的列表
    searchKeyword: ''    // 搜索关键词
  },
  
  onShow() {
    // 每次显示时重新加载数据
    this.loadItems()
  },
  
  loadItems() {
    const items = getItems()
    this.setData({
      items,
      filteredItems: items
    })
  },
  
  onSearch(e) {
    const keyword = e.detail.value.toLowerCase()
    const filtered = this.data.items.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword) ||
      (item.note && item.note.toLowerCase().includes(keyword))
    )
    this.setData({
      searchKeyword: keyword,
      filteredItems: filtered
    })
  },
  
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },
  
  goToAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  }
})
```

**界面要点：**
- 搜索框固定在顶部
- 列表项显示：名称、位置、数量（单位）
- 数量<=2时，数字显示橙色
- 空列表显示引导文案

---

### Page 2: 新增物品页（pages/add/）

**功能：**
录入物品信息并保存

**字段顺序（严格遵守）：**
1. 物品名称（input，必填）
2. 数量（input type="digit"，默认1）
3. 单位（input，可选，默认折叠）
4. 存放位置（picker，必填）
5. 分类（picker，可选）
6. 备注（textarea，最多250字符）

**关键逻辑：**

```javascript
// add.js
Page({
  data: {
    name: '',
    count: 1,
    unit: '',
    location: '',
    category: '',
    note: '',
    showUnit: false,        // 单位字段是否显示
    locations: [],          // 位置列表
    categories: []          // 分类列表
  },
  
  onLoad() {
    const settings = getSettings()
    this.setData({
      locations: settings.locations || [],
      categories: settings.categories || []
    })
  },
  
  onSave() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }
    if (!this.data.location) {
      wx.showToast({ title: '请选择存放位置', icon: 'none' })
      return
    }
    
    const item = {
      id: generateId(),
      name: this.data.name,
      location: this.data.location,
      count: this.data.count || 1,
      unit: this.data.unit,
      category: this.data.category,
      note: this.data.note,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      history: []
    }
    
    addItem(item)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
```

**交互细节：**
- 名称为空时，保存按钮置灰或弹出提示
- 位置选择器支持"添加新位置"选项
- 单位字段默认隐藏，点击"添加单位"展开

---

### Page 3: 物品详情页（pages/detail/）

**功能：**
1. 查看物品信息
2. 快速加减库存（+/- 按钮）
3. 编辑物品信息
4. 删除物品
5. 查看库存变更记录

**关键逻辑：**

```javascript
// detail.js
Page({
  data: {
    item: null,
    initialCount: 0,     // 进入页面时的初始数量
    noteExpanded: false  // 备注是否展开
  },
  
  onLoad(options) {
    const item = getItemById(options.id)
    this.setData({
      item,
      initialCount: item.count
    })
  },
  
  onUnload() {
    // 离开页面时记录库存变更
    const delta = this.data.item.count - this.data.initialCount
    if (delta !== 0) {
      addHistoryRecord(this.data.item.id, delta)
    }
  },
  
  onIncrease() {
    const count = this.data.item.count + 1
    this.updateCount(count)
  },
  
  onDecrease() {
    if (this.data.item.count > 0) {
      const count = this.data.item.count - 1
      this.updateCount(count)
    }
  },
  
  updateCount(count) {
    const item = { ...this.data.item, count }
    this.setData({ item })
    updateItem(item.id, { count, updatedAt: getTimestamp() })
  },
  
  onDelete() {
    wx.showModal({
      title: '提示',
      content: '确定要删除这个物品吗？',
      success: (res) => {
        if (res.confirm) {
          deleteItem(this.data.item.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      }
    })
  }
})
```

**库存变更记录规则：**
- **记录时机**：`onUnload()` 时检查数量变化
- **记录条件**：`delta !== 0`
- **不记录**：新增物品、编辑页面直接修改数量
- **显示格式**：`+2 → 剩余10  2026-02-09 15:30`
- **颜色**：delta > 0 绿色，delta < 0 橙色

**备注展示：**
- 默认显示前5行
- 超过80字符显示"展开"按钮
- 支持长按复制（`user-select: text`）

---

### Page 4: 我的页面（pages/mine/）

**功能：**
1. 主题设置
2. 位置/分类管理
3. 存储空间显示
4. 清空数据

**关键逻辑：**

```javascript
// mine.js
Page({
  data: {
    theme: 'system',
    storageSize: '0 KB',
    locations: [],
    categories: []
  },
  
  onShow() {
    this.loadSettings()
    this.calculateStorage()
  },
  
  onThemeChange(e) {
    const theme = e.detail.value
    saveSettings({ theme })
    this.applyTheme(theme)
  },
  
  applyTheme(theme) {
    // 实现主题切换逻辑
    // 如果是'system'，检测系统主题
    // 如果是'light'或'dark'，应用对应主题
  },
  
  calculateStorage() {
    const size = getStorageSize()
    this.setData({ storageSize: size })
  },
  
  onClearAll() {
    wx.showModal({
      title: '警告',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      confirmText: '确定清空',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '真的要删除所有物品吗？',
            success: (res2) => {
              if (res2.confirm) {
                wx.clearStorageSync()
                wx.showToast({ title: '已清空', icon: 'success' })
                this.onShow()
              }
            }
          })
        }
      }
    })
  }
})
```

---

## 🎨 主题实现

### 主题切换逻辑

**在 app.js 中：**

```javascript
App({
  globalData: {
    theme: 'system'
  },
  
  onLaunch() {
    this.initTheme()
  },
  
  initTheme() {
    const settings = getSettings()
    const theme = settings.theme || 'system'
    this.applyTheme(theme)
  },
  
  applyTheme(theme) {
    if (theme === 'system') {
      // 检测系统主题
      const systemInfo = wx.getSystemInfoSync()
      const isDark = systemInfo.theme === 'dark'
      this.setTheme(isDark ? 'dark' : 'light')
    } else {
      this.setTheme(theme)
    }
  },
  
  setTheme(theme) {
    this.globalData.theme = theme
    wx.setNavigationBarColor({
      frontColor: theme === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5'
    })
  }
})
```

**在页面wxss中：**

```css
/* 浅色模式（默认） */
.page {
  background-color: #f5f5f5;
  color: #333;
}

/* 深色模式 */
.page.theme-dark {
  background-color: #1a1a1a;
  color: #e0e0e0;
}
```

---

## ⚠️ 重要开发规范

### 1. 数据操作规范

- ❌ **禁止**直接操作 `this.data.items`
- ✅ **必须**通过 utils/settings.js 的工具函数
- ✅ **必须**在每次数据变更后立即调用 `saveItems()`

### 2. 时间处理规范

- 使用**秒级时间戳**：`Math.floor(Date.now() / 1000)`
- 显示时转换为人类可读格式：`2026-02-09 15:30`

### 3. ID生成规范

```javascript
function generateId() {
  return `item_${Date.now()}`
}
```

### 4. 库存变更记录规范

```javascript
// 正确：在 onUnload 时记录
onUnload() {
  const delta = this.data.item.count - this.data.initialCount
  if (delta !== 0) {
    addHistoryRecord(this.data.item.id, delta)
  }
}

// 错误：每次点击 +/- 就记录
onIncrease() {
  // ❌ 不要在这里记录历史
  addHistoryRecord(...)  
}
```

### 5. 搜索规范

- 使用 `toLowerCase()` 实现大小写不敏感
- 搜索字段：name、location、note
- 实时过滤，无需点击搜索按钮

### 6. 防呆设计规范

- 所有删除操作**必须**二次确认
- 清空数据**必须**双重确认
- 数量不可小于0
- 名称和位置为必填项

---

## 🐛 常见问题处理

### Q1: 如何处理数据迁移？

**A:** 第一版无需考虑数据迁移，直接使用最新数据结构。

### Q2: 如何处理并发修改？

**A:** 单用户模式，无需考虑并发问题。

### Q3: 存储空间计算方法？

```javascript
function getStorageSize() {
  const info = wx.getStorageInfoSync()
  const size = info.currentSize // KB
  if (size > 1024) {
    return `${(size / 1024).toFixed(2)} MB`
  }
  return `${size} KB`
}
```

### Q4: 如何处理空列表？

在 wxml 中使用条件渲染：

```xml
<view wx:if="{{filteredItems.length === 0}}" class="empty-state">
  <text>🏡 家里还没有记录物品哦～</text>
  <text>先加一个吧，让生活更有条理 ✨</text>
</view>
```

---

## ✅ 验收清单

在完成开发后，请确保以下功能正常：

- [ ] 可新增物品（所有字段保存正确）
- [ ] 可搜索物品（名称、位置、备注）
- [ ] 可查看物品详情
- [ ] 可通过 +/- 按钮修改库存
- [ ] 可编辑物品信息
- [ ] 可删除物品（有二次确认）
- [ ] 库存变更记录正确显示（离开页面时记录）
- [ ] 主题切换功能正常
- [ ] 位置/分类管理功能正常
- [ ] 存储空间显示正确
- [ ] 清空数据功能正常（双重确认）
- [ ] 数据持久化（关闭重开后数据仍在）

---

## 📚 参考资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [本地存储API](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html)

---

**AI代理，开始编码吧！记住：简单、直观、低负担。** 🚀
