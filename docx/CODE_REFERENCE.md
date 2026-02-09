# 代码实现清单 - 特殊物品到期管理

快速查阅关键代码实现

---

## 1. 数据结构（新增字段）

```javascript
// Item 数据结构
{
  // ... 原有字段
  isSpecial: false,              // 是否为特殊物品
  expireAt: null                 // 到期时间戳（毫秒）
}
```

---

## 2. pages/add/add.js 关键代码

### 2.1 data 新增

```javascript
data: {
  // ... 原有字段
  isSpecial: false,   // 是否为特殊物品
  expireDate: '',     // 到期日期（YYYY-MM-DD）
}
```

### 2.2 新增方法

```javascript
/**
 * 切换是否为特殊物品
 */
onSpecialChange: function (e) {
  const isSpecial = e.detail.value;
  this.setData({ 
    isSpecial: isSpecial,
    expireDate: isSpecial ? this.data.expireDate : ''
  });
},

/**
 * 选择到期日期
 */
onExpireDateChange: function (e) {
  this.setData({ expireDate: e.detail.value });
},
```

### 2.3 保存逻辑修改

```javascript
const newItem = {
  // ... 原有字段
  isSpecial: this.data.isSpecial || false,
  expireAt: this.data.isSpecial && this.data.expireDate 
    ? new Date(this.data.expireDate).getTime() 
    : null
};
```

---

## 3. pages/add/add.wxml 新增代码

```xml
<!-- 特殊物品选项 -->
<view class="form-item form-item-special">
  <view class="form-label">
    <text class="label-emoji">⏰</text>
    <text>这是特殊物品（有使用期限）</text>
  </view>
  <switch class="form-switch" checked="{{isSpecial}}" bindchange="onSpecialChange" color="#3a86ff" />
</view>

<!-- 到期日期选择器 -->
<view class="form-item" wx:if="{{isSpecial}}">
  <view class="form-label">
    <text class="label-emoji">📅</text>
    <text>到期日期</text>
    <text class="required">*</text>
  </view>
  <picker class="form-picker" mode="date" value="{{expireDate}}" bindchange="onExpireDateChange">
    <view class="{{expireDate ? 'select-value' : 'select-placeholder'}}">
      {{expireDate || '点击选择到期日期'}}
    </view>
  </picker>
</view>
```

---

## 4. pages/index/index.js 关键代码

### 4.1 data 新增

```javascript
data: {
  // ... 原有字段
  normalItems: [],       // 常规物品列表
  specialItems: []       // 特殊物品列表
}
```

### 4.2 核心方法：到期状态计算

```javascript
/**
 * 获取物品的到期状态
 */
getExpireStatus: function (expireAt) {
  const now = Date.now();
  const diffMs = expireAt - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // 已到期
  if (diffMs <= 0) {
    return {
      status: 'expired',
      text: '已到期',
      className: 'expire-expired',
      daysRemaining: daysRemaining
    };
  }
  // 7天内即将到期（紧急）
  else if (daysRemaining <= 7) {
    return {
      status: 'danger',
      text: `${daysRemaining}天后到期`,
      className: 'expire-danger',
      daysRemaining: daysRemaining
    };
  }
  // 30天内即将到期（警告）
  else if (daysRemaining <= 30) {
    return {
      status: 'warning',
      text: `${daysRemaining}天后到期`,
      className: 'expire-warning',
      daysRemaining: daysRemaining
    };
  }
  // 正常
  else {
    return {
      status: 'normal',
      text: `${daysRemaining}天后到期`,
      className: '',
      daysRemaining: daysRemaining
    };
  }
},
```

### 4.3 核心方法：特殊物品排序

```javascript
/**
 * 对特殊物品进行排序
 * 规则：1. 未到期优先 2. 按到期时间升序 3. 已到期置底
 */
sortSpecialItems: function (items) {
  return items.sort((a, b) => {
    const aExpired = a.expireStatus === 'expired';
    const bExpired = b.expireStatus === 'expired';
    
    // 如果a已到期，b未到期，a排后面
    if (aExpired && !bExpired) return 1;
    // 如果b已到期，a未到期，b排后面
    if (!aExpired && bExpired) return -1;
    
    // 都已到期或都未到期，按到期时间升序
    return (a.expireAt || 0) - (b.expireAt || 0);
  });
},
```

### 4.4 修改 loadItems 方法

```javascript
loadItems: function () {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    let items = (data && data.items) ? data.items : [];
    
    // 为每个物品添加到期状态信息
    items = items.map(item => {
      if (item.isSpecial && item.expireAt) {
        const expireStatus = this.getExpireStatus(item.expireAt);
        return {
          ...item,
          expireStatus: expireStatus.status,
          expireStatusText: expireStatus.text,
          expireStatusClass: expireStatus.className,
          daysRemaining: expireStatus.daysRemaining
        };
      }
      return item;
    });
    
    // 分类并排序
    const normalItems = items.filter(item => !item.isSpecial);
    const specialItems = this.sortSpecialItems(items.filter(item => item.isSpecial));
    
    this.setData({
      items: items,
      normalItems: normalItems,
      specialItems: specialItems,
      filteredItems: items,
      isEmpty: items.length === 0
    });
  } catch (e) {
    console.error('读取本地存储失败:', e);
  }
},
```

### 4.5 修改 filterItems 方法

```javascript
filterItems: function (keyword) {
  if (!keyword || keyword.trim() === '') {
    // 如果没有搜索关键词，重新分类显示
    const normalItems = this.data.items.filter(item => !item.isSpecial);
    const specialItems = this.sortSpecialItems(this.data.items.filter(item => item.isSpecial));
    this.setData({
      normalItems: normalItems,
      specialItems: specialItems,
      isEmpty: this.data.items.length === 0
    });
    return;
  }

  const lowerKeyword = keyword.toLowerCase().trim();
  const filtered = this.data.items.filter(item => {
    const name = (item.name || '').toLowerCase();
    const location = (item.location || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const note = (item.note || '').toLowerCase();
    return name.includes(lowerKeyword) ||
        location.includes(lowerKeyword) ||
        category.includes(lowerKeyword) ||
        note.includes(lowerKeyword);
  });

  // 搜索时也要分类
  const normalItems = filtered.filter(item => !item.isSpecial);
  const specialItems = this.sortSpecialItems(filtered.filter(item => item.isSpecial));
  
  this.setData({
    normalItems: normalItems,
    specialItems: specialItems,
    isEmpty: filtered.length === 0 && this.data.items.length === 0
  });
},
```

---

## 5. pages/index/index.wxml 修改

```xml
<!-- 物品列表 -->
<view class="item-list" wx:if="{{normalItems.length > 0 || specialItems.length > 0}}">
  <!-- 常规物品区块 -->
  <view wx:if="{{normalItems.length > 0}}" class="item-section">
    <view class="section-title">📦 常规物品</view>
    <view class="item-card card-animate" wx:for="{{normalItems}}" wx:key="id" data-id="{{item.id}}" bindtap="onItemTap">
      <!-- 常规物品内容 -->
    </view>
  </view>
  
  <!-- 特殊物品区块 -->
  <view wx:if="{{specialItems.length > 0}}" class="item-section">
    <view class="section-title">⏰ 特殊物品（有使用期限）</view>
    <view class="item-card card-animate {{item.expireStatusClass}}" wx:for="{{specialItems}}" wx:key="id" data-id="{{item.id}}" bindtap="onItemTap">
      <view class="card-main">
        <view class="card-icon">⏰</view>
        <view class="card-info">
          <text class="card-name">{{item.name}}</text>
          <view class="card-location">
            <text class="location-icon">📍</text>
            <text class="location-text">{{item.location}}</text>
          </view>
          <!-- 到期状态 -->
          <view class="expire-status {{item.expireStatusClass}}" wx:if="{{item.expireStatusText}}">
            <text>{{item.expireStatusText}}</text>
          </view>
        </view>
        <view class="card-count-wrapper">
          <view class="card-count {{item.count <= 2 ? 'low-count' : ''}}">
            {{item.count}}{{item.unit ? item.unit : ''}}
          </view>
        </view>
      </view>
      <view class="card-arrow">›</view>
    </view>
  </view>
</view>
```

---

## 6. 样式代码

### 6.1 pages/index/index.wxss

```css
/* 区块标题 */
.item-section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #4a4a4a;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
}

/* 到期状态标签 */
.expire-status {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  margin-top: 10rpx;
  font-weight: 500;
}

/* 警告状态（30天内） - 黄色 */
.expire-warning {
  background-color: #fff4e6;
  color: #e67e22;
}
.item-card.expire-warning {
  border-left: 6rpx solid #f39c12;
}

/* 危险状态（7天内） - 红色 */
.expire-danger {
  background-color: #ffe6e6;
  color: #e74c3c;
}
.item-card.expire-danger {
  border-left: 6rpx solid #e74c3c;
}

/* 已到期状态 - 灰色 */
.expire-expired {
  background-color: #f0f0f0;
  color: #999999;
}
.item-card.expire-expired {
  opacity: 0.6;
  border-left: 6rpx solid #cccccc;
}

/* 深色模式适配 */
.theme-dark .section-title {
  color: #f0f0f0;
}
.theme-dark .expire-warning {
  background-color: rgba(230, 126, 34, 0.2);
  color: #f39c12;
}
.theme-dark .expire-danger {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
.theme-dark .expire-expired {
  background-color: rgba(153, 153, 153, 0.2);
  color: #888888;
}
```

### 6.2 pages/add/add.wxss

```css
/* 特殊物品选项 */
.form-item-special {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-item-special .form-label {
  margin-bottom: 0;
  flex: 1;
}

.form-switch {
  transform: scale(0.9);
}

/* 时间选择器样式 */
.form-picker {
  width: 100%;
  padding: 22rpx 28rpx;
  background-color: #faf8f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #5a5a5a;
  border: 2rpx solid #f0ebe4;
}

.form-picker .select-placeholder {
  color: #c0b8ae;
}

.form-picker .select-value {
  color: #5a5a5a;
  font-weight: 500;
}
```

---

## 7. 关键逻辑流程图

```
新增物品流程：
用户勾选"特殊物品" → 显示日期选择器 → 选择到期日期 → 点击保存
→ isSpecial = true
→ expireAt = new Date(expireDate).getTime()
→ 保存到本地存储

首页加载流程：
读取所有物品 → 计算特殊物品的到期状态 → 分类（常规/特殊） 
→ 对特殊物品排序 → 渲染到页面

到期状态计算：
计算剩余天数
→ ≤ 0天：已到期（灰色）
→ ≤ 7天：危险（红色）
→ ≤ 30天：警告（黄色）
→ > 30天：正常（默认）

排序逻辑：
未到期物品排前面
→ 按到期时间升序
→ 已到期物品排最后
```

---

**文档用途：** 快速查阅关键代码实现，便于维护和扩展
