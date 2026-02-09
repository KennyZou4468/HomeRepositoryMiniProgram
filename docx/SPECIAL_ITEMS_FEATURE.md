# 特殊物品到期管理功能文档

**功能版本：** v1.1  
**更新日期：** 2026年2月9日  
**功能状态：** ✅ 已实现

---

## 一、功能概述

本功能为家庭物品管理小程序新增了【特殊物品到期管理】能力，允许用户对有使用期限的物品（如食品、药品、化妆品等）进行专门管理，并根据到期时间自动显示不同的状态提醒。

---

## 二、数据结构变更

### 2.1 Item 数据结构新增字段

在原有 Item 数据结构基础上，新增以下字段：

```javascript
{
  // ... 原有字段（id, name, location, count, unit, category, note, createdAt, updatedAt）
  
  // 新增字段
  isSpecial: boolean,        // 是否为特殊物品（有使用期限）
  expireAt: number | null    // 到期时间戳（毫秒），特殊物品必填
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isSpecial | boolean | 是 | 标识是否为特殊物品，默认 false |
| expireAt | number \| null | 条件必填 | 到期时间戳（毫秒），当 isSpecial=true 时必填 |

**示例数据：**

```javascript
// 常规物品示例
{
  id: "item_1707543210123",
  name: "5号电池",
  location: "客厅 / 电视柜 / 抽屉",
  count: 8,
  unit: "节",
  category: "日用品",
  note: "遥控器用",
  createdAt: 1707543210000,
  updatedAt: 1707543500000,
  isSpecial: false,          // 常规物品
  expireAt: null             // 无到期时间
}

// 特殊物品示例
{
  id: "item_1707543220456",
  name: "牛奶",
  location: "冰箱 / 冷藏室",
  count: 2,
  unit: "瓶",
  category: "食品 / 零食",
  note: "注意保质期",
  createdAt: 1707543220000,
  updatedAt: 1707543600000,
  isSpecial: true,           // 特殊物品
  expireAt: 1708147200000    // 到期时间：2026-02-17
}
```

---

## 三、功能实现详解

### 3.1 新增物品页（pages/add）

#### 3.1.1 界面变更

在原有表单基础上，新增以下两个字段：

**1. 特殊物品开关**
- 位置：备注字段后
- 控件：Switch 开关
- 文案：「这是特殊物品（有使用期限）」
- 图标：⏰

**2. 到期日期选择器**
- 显示条件：仅当 isSpecial = true 时显示
- 控件：picker（mode="date"）
- 文案：「到期日期 *」
- 图标：📅
- 必填提示：红色星号 *

#### 3.1.2 代码实现

**data 字段新增：**
```javascript
data: {
  // ... 原有字段
  isSpecial: false,   // 是否为特殊物品
  expireDate: '',     // 到期日期（格式：YYYY-MM-DD）
}
```

**事件处理函数：**

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

**保存逻辑修改：**

```javascript
// 创建新物品对象时添加特殊物品字段
const newItem = {
  // ... 原有字段
  isSpecial: this.data.isSpecial || false,
  expireAt: this.data.isSpecial && this.data.expireDate 
    ? new Date(this.data.expireDate).getTime() 
    : null
};
```

---

### 3.2 首页物品列表（pages/index）

#### 3.2.1 分类展示逻辑

首页将物品分为两个区块展示：

1. **📦 常规物品**
   - 展示 isSpecial = false 的物品
   - 保持原有样式和交互

2. **⏰ 特殊物品（有使用期限）**
   - 展示 isSpecial = true 的物品
   - 显示到期状态标签
   - 根据到期时间自动排序
   - 应用不同的状态样式

#### 3.2.2 到期状态判断逻辑

**核心函数：getExpireStatus(expireAt)**

```javascript
/**
 * 获取物品的到期状态
 * @param {number} expireAt - 到期时间戳（毫秒）
 * @returns {object} 包含状态、文案、样式类名和剩余天数
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
}
```

**状态分类规则：**

| 状态 | 条件 | 文案示例 | 样式类名 | 颜色 |
|------|------|----------|----------|------|
| expired | 已过期 | 已到期 | expire-expired | 灰色 |
| danger | ≤ 7天 | 3天后到期 | expire-danger | 红色 |
| warning | 8-30天 | 15天后到期 | expire-warning | 黄色 |
| normal | > 30天 | 45天后到期 | （无） | 默认 |

#### 3.2.3 排序逻辑

**核心函数：sortSpecialItems(items)**

```javascript
/**
 * 对特殊物品进行排序
 * 规则：
 * 1. 未到期的物品排在前面
 * 2. 按到期时间升序（越早到期越靠前）
 * 3. 已到期的物品统一排在最后
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
}
```

**排序规则说明：**

1. **第一优先级**：未到期物品 > 已到期物品
2. **第二优先级**：到期时间越早越靠前
3. **效果**：
   - 即将到期的物品排在最前面（紧急提醒）
   - 已到期的物品沉底显示（降低干扰）

#### 3.2.4 数据加载流程

```javascript
loadItems: function () {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    let items = (data && data.items) ? data.items : [];
    
    // 1. 为每个特殊物品添加到期状态信息
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
    
    // 2. 分类
    const normalItems = items.filter(item => !item.isSpecial);
    const specialItems = this.sortSpecialItems(
      items.filter(item => item.isSpecial)
    );
    
    // 3. 更新数据
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
}
```

---

## 四、样式设计

### 4.1 到期状态样式

#### 4.1.1 状态标签样式

```css
/* 基础标签样式 */
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

/* 危险状态（7天内） - 红色 */
.expire-danger {
  background-color: #ffe6e6;
  color: #e74c3c;
}

/* 已到期状态 - 灰色 */
.expire-expired {
  background-color: #f0f0f0;
  color: #999999;
}
```

#### 4.1.2 卡片左侧边框标识

```css
/* 警告状态卡片 */
.item-card.expire-warning {
  border-left: 6rpx solid #f39c12;
}

/* 危险状态卡片 */
.item-card.expire-danger {
  border-left: 6rpx solid #e74c3c;
}

/* 已到期卡片 */
.item-card.expire-expired {
  opacity: 0.6;
  border-left: 6rpx solid #cccccc;
}
```

#### 4.1.3 区块标题样式

```css
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #4a4a4a;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
}
```

### 4.2 深色模式适配

```css
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

---

## 五、用户交互流程

### 5.1 添加特殊物品流程

```
1. 用户进入"添加物品"页面
2. 填写基本信息（物品名称、数量、位置等）
3. 勾选"这是特殊物品（有使用期限）"
4. 自动展开"到期日期"选择器
5. 点击选择器，选择到期日期
6. 点击"✓ 保存到家里"
7. 系统保存物品（isSpecial=true, expireAt=选定日期的时间戳）
8. 返回首页，物品出现在"特殊物品"区块
```

### 5.2 首页查看流程

```
1. 用户进入首页
2. 系统自动加载物品列表
3. 系统计算每个特殊物品的到期状态
4. 按分类展示：
   - 常规物品区块
   - 特殊物品区块（按到期时间排序）
5. 用户可看到：
   - 物品名称、位置、数量
   - 到期状态标签（如"3天后到期"）
   - 不同颜色的左侧边框标识
```

---

## 六、注意事项

### 6.1 开发注意事项

1. **时间戳单位**：expireAt 存储为毫秒级时间戳（Date.getTime()）
2. **日期格式**：picker 返回 YYYY-MM-DD 格式，需转换为时间戳
3. **状态实时性**：每次 loadItems 都会重新计算到期状态
4. **搜索兼容**：搜索时也需要对结果进行分类和排序
5. **空值处理**：常规物品的 expireAt 为 null

### 6.2 用户体验优化

1. **视觉提示清晰**：
   - 7天内用红色，引起高度注意
   - 30天内用黄色，提醒用户注意
   - 已到期用灰色并置底，降低视觉干扰

2. **操作便捷**：
   - Switch 开关切换是否为特殊物品
   - 原生 picker 选择日期，符合用户习惯
   - 取消勾选自动清空日期

3. **排序合理**：
   - 紧急物品排前面
   - 已过期物品沉底
   - 同状态按时间排序

### 6.3 后续扩展建议

1. **到期提醒**：可考虑添加本地通知提醒功能
2. **批量操作**：支持批量删除已过期物品
3. **自动处理**：到期后自动减库存或移除
4. **统计功能**：统计即将到期物品数量

---

## 七、验收清单

### 7.1 功能验收

- [ ] 新增物品时可勾选"特殊物品"
- [ ] 勾选后显示日期选择器
- [ ] 取消勾选后隐藏日期选择器
- [ ] 保存时正确存储 isSpecial 和 expireAt
- [ ] 首页正确分类展示（常规 + 特殊）
- [ ] 特殊物品显示到期状态标签
- [ ] 30天内显示黄色警告状态
- [ ] 7天内显示红色危险状态
- [ ] 已到期显示灰色并置底
- [ ] 特殊物品按到期时间正确排序
- [ ] 搜索时分类和排序正常

### 7.2 样式验收

- [ ] 区块标题样式正确
- [ ] 状态标签颜色正确
- [ ] 卡片左侧边框显示正确
- [ ] 已到期物品半透明显示
- [ ] 深色模式下样式正常
- [ ] Switch 开关样式正常
- [ ] 日期选择器样式正常

### 7.3 兼容性验收

- [ ] 常规物品功能不受影响
- [ ] 搜索功能正常工作
- [ ] 详情页查看正常
- [ ] 数据持久化正常
- [ ] 无控制台错误

---

## 八、技术实现总结

### 8.1 核心技术点

1. **数据结构扩展**：向后兼容的字段新增
2. **状态计算**：基于时间戳的动态状态判断
3. **列表排序**：多条件复杂排序算法
4. **条件渲染**：wx:if 控制组件显示
5. **样式隔离**：类名控制不同状态样式

### 8.2 代码组织

```
pages/
├── add/
│   ├── add.js          # 新增 isSpecial, expireDate 字段和事件处理
│   ├── add.wxml        # 新增 Switch 开关和 picker 选择器
│   └── add.wxss        # 新增特殊物品表单样式
└── index/
    ├── index.js        # 新增分类逻辑、状态判断、排序函数
    ├── index.wxml      # 新增分组展示和状态标签
    └── index.wxss      # 新增到期状态样式
```

---

**文档状态：** ✅ 已完成  
**功能状态：** ✅ 已实现  
**最后更新：** 2026年2月9日
