# 调试指南 - 特殊物品分类显示问题

## 问题描述
首页只显示常规物品，添加了有时间限制的物品也展现在了常规物品页面下，而不是特殊物品区块。

## 可能的原因

### 1. 数据保存问题
检查新增物品时 `isSpecial` 和 `expireAt` 是否正确保存。

**调试步骤：**

1. 打开微信开发者工具
2. 进入 Console 控制台
3. 添加一个特殊物品后，运行以下代码检查数据：

```javascript
// 查看本地存储的数据
const data = wx.getStorageSync('home_items');
console.log('所有物品数据：', data);

// 检查最新添加的物品
if (data && data.items && data.items.length > 0) {
  const lastItem = data.items[data.items.length - 1];
  console.log('最新物品：', lastItem);
  console.log('isSpecial：', lastItem.isSpecial);
  console.log('expireAt：', lastItem.expireAt);
}
```

**预期结果：**
- `isSpecial` 应该为 `true`
- `expireAt` 应该是一个时间戳数字（如 1708147200000）

**如果不符合预期：** pages/add/add.js 的保存逻辑有问题

---

### 2. 页面加载问题
检查首页是否正确读取和分类数据。

**调试步骤：**

在 `pages/index/index.js` 的 `loadItems` 方法中添加调试日志：

```javascript
loadItems: function () {
    try {
        const data = wx.getStorageSync(STORAGE_KEY);
        let items = (data && data.items) ? data.items : [];
        
        console.log('=== 加载物品数据 ===');
        console.log('总物品数：', items.length);
        
        // 为每个物品添加到期状态信息
        items = items.map(item => {
            console.log(`物品：${item.name}, isSpecial: ${item.isSpecial}, expireAt: ${item.expireAt}`);
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
        
        console.log('常规物品数：', normalItems.length);
        console.log('特殊物品数：', specialItems.length);
        console.log('特殊物品列表：', specialItems);
        
        this.setData({
            items: items,
            normalItems: normalItems,
            specialItems: specialItems,
            filteredItems: items,
            isEmpty: items.length === 0
        });
        
        // 如果有搜索关键词，重新过滤
        if (this.data.searchText) {
            this.filterItems(this.data.searchText);
        }
    } catch (e) {
        console.error('读取本地存储失败:', e);
        this.setData({
            items: [],
            normalItems: [],
            specialItems: [],
            filteredItems: [],
            isEmpty: true
        });
    }
},
```

---

### 3. 快速修复方案

如果上述调试发现 `isSpecial` 字段缺失或为 `false`，可能是因为：

**方案A：清空数据重新测试**

```javascript
// 在控制台执行
wx.removeStorageSync('home_items');
console.log('已清空数据，请重新添加物品测试');
```

**方案B：手动修复现有数据**

```javascript
// 在控制台执行，将某个物品改为特殊物品
const data = wx.getStorageSync('home_items');
if (data && data.items && data.items.length > 0) {
  // 修改最后一个物品为特殊物品
  const lastIndex = data.items.length - 1;
  data.items[lastIndex].isSpecial = true;
  data.items[lastIndex].expireAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7天后到期
  
  wx.setStorageSync('home_items', data);
  console.log('已修复数据，请刷新页面查看');
}
```

---

## 完整的检查清单

### ☑️ 步骤1：检查 add.js 保存逻辑

打开 `pages/add/add.js`，找到 `onSave` 方法，确保有以下代码：

```javascript
// 创建新物品对象
const newItem = {
  id: id,
  name: name.trim(),
  location: location.trim(),
  count: finalCount,
  unit: unit.trim(),
  category: category.trim(),
  note: note.trim(),
  createdAt: now,
  updatedAt: now,
  // 特殊物品相关字段 - 必须有这两行！
  isSpecial: this.data.isSpecial || false,
  expireAt: this.data.isSpecial && this.data.expireDate 
    ? new Date(this.data.expireDate).getTime() 
    : null
};
```

**检查要点：**
- 确保有 `isSpecial` 和 `expireAt` 字段
- `this.data.isSpecial` 正确获取
- `this.data.expireDate` 正确获取
- 使用 `.getTime()` 转换为时间戳

---

### ☑️ 步骤2：检查 add.wxml UI组件

打开 `pages/add/add.wxml`，确保备注字段后有以下代码：

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

**检查要点：**
- Switch 的 `bindchange="onSpecialChange"` 绑定正确
- Picker 的 `bindchange="onExpireDateChange"` 绑定正确
- `checked="{{isSpecial}}"` 和 `value="{{expireDate}}"` 正确

---

### ☑️ 步骤3：检查 add.js 事件处理

确保 `pages/add/add.js` 中有以下两个方法：

```javascript
/**
 * 切换是否为特殊物品
 */
onSpecialChange: function (e) {
  const isSpecial = e.detail.value;
  this.setData({ 
    isSpecial: isSpecial,
    // 如果取消勾选，清空到期日期
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

---

### ☑️ 步骤4：检查 index.js 分类逻辑

确保 `pages/index/index.js` 的 `loadItems` 方法中有：

```javascript
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
```

---

### ☑️ 步骤5：检查 index.wxml 渲染逻辑

确保 `pages/index/index.wxml` 中有两个区块：

```xml
<!-- 常规物品区块 -->
<view wx:if="{{normalItems.length > 0}}" class="item-section">
  <view class="section-title">📦 常规物品</view>
  <!-- ... -->
</view>

<!-- 特殊物品区块 -->
<view wx:if="{{specialItems.length > 0}}" class="item-section">
  <view class="section-title">⏰ 特殊物品（有使用期限）</view>
  <!-- ... -->
</view>
```

---

## 常见问题排查

### 问题1：勾选了"特殊物品"但保存后仍显示在常规物品

**原因：** `isSpecial` 没有正确保存

**解决：** 
1. 检查 add.js 的 data 中是否有 `isSpecial: false`
2. 检查 onSave 方法中是否正确读取 `this.data.isSpecial`
3. 在 onSave 开始处添加调试：
   ```javascript
   console.log('保存时 isSpecial:', this.data.isSpecial);
   console.log('保存时 expireDate:', this.data.expireDate);
   ```

---

### 问题2：选择了日期但没有保存

**原因：** `expireAt` 时间戳转换失败

**解决：**
1. 检查 expireDate 格式是否为 YYYY-MM-DD
2. 确保使用 `new Date(this.data.expireDate).getTime()` 转换
3. 添加调试：
   ```javascript
   const expireAt = new Date(this.data.expireDate).getTime();
   console.log('expireDate:', this.data.expireDate);
   console.log('expireAt timestamp:', expireAt);
   ```

---

### 问题3：所有物品都显示在常规物品

**原因：** 过滤条件错误

**解决：**
检查 filter 条件是否正确：
```javascript
// 正确的写法
const normalItems = items.filter(item => !item.isSpecial);
const specialItems = items.filter(item => item.isSpecial);

// 错误的写法（会导致所有物品都是常规）
const normalItems = items.filter(item => item.isSpecial === false);
```

因为 `undefined === false` 返回 `false`，所以当 `isSpecial` 字段不存在时会被过滤掉。

---

## 测试步骤

### 完整测试流程：

1. **清空数据**（可选）
   ```javascript
   wx.removeStorageSync('home_items');
   ```

2. **添加一个常规物品**
   - 不勾选"特殊物品"
   - 保存
   - 检查首页是否显示在"📦 常规物品"区块

3. **添加一个特殊物品**
   - 勾选"特殊物品"
   - 选择到期日期（如7天后）
   - 保存
   - 检查首页是否显示在"⏰ 特殊物品（有使用期限）"区块
   - 检查是否显示到期状态（如"7天后到期"）
   - 检查颜色是否为红色

4. **验证数据结构**
   ```javascript
   const data = wx.getStorageSync('home_items');
   console.log('验证数据：', JSON.stringify(data, null, 2));
   ```

---

## 如果问题仍未解决

请提供以下信息：

1. **控制台输出的数据结构**（执行上面的验证代码）
2. **是否看到 Switch 开关和日期选择器**
3. **保存时控制台是否有错误**
4. **微信开发者工具版本**

然后我可以提供更具体的解决方案。

---

**最后更新：** 2026年2月9日
