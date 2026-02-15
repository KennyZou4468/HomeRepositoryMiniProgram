# Agent Instructions
# 家庭物品管理微信小程序 — AI Agent 快速入手指南

> **目标读者：** AI Agent（GitHub Copilot、Claude 等）
> **最后更新：** 2026-02-13
> **版本：** v1.1

---

## 1. 项目目标

开发一个**微信小程序**，帮助家庭用户管理物品的**存放位置**和**库存数量**。

**核心关键词：** 本地存储、无后端、单用户、轻量、即用即走

**核心价值：**
- 快速查询物品在家里的位置
- 掌握库存余量，低库存预警
- 特殊物品（食品/药品等）到期提醒
- 操作简单，学习成本低

---

## 2. 已实现功能清单

### v1.0 基础功能
| 功能 | 状态 | 涉及页面 |
|------|------|----------|
| 物品增删改查 | ✅ | add, detail, index |
| 实时搜索（名称/位置/备注模糊匹配） | ✅ | index |
| 库存 +/- 操作 | ✅ | detail |
| 库存变更历史记录（最多20条） | ✅ | detail |
| 存放位置管理（预设+自定义） | ✅ | mine |
| 物品分类管理（预设+自定义） | ✅ | mine |
| 深浅色主题切换（跟随系统/手动） | ✅ | 全局 |
| 存储空间管理（MB/KB显示、清空） | ✅ | mine |
| 自定义 TabBar | ✅ | custom-tab-bar |

### v1.1 新增功能
| 功能 | 状态 | 涉及页面 |
|------|------|----------|
| 特殊物品标记（isSpecial 字段） | ✅ | add |
| 到期日期选择（expireAt 字段） | ✅ | add |
| 分类切换 Tab（常规/特殊） | ✅ | index |
| 到期状态自动计算与颜色提醒 | ✅ | index |
| 特殊物品按紧急度排序 | ✅ | index |
| 开发者名片卡 + GitHub 链接 | ✅ | mine |

---

## 3. 技术栈

| 项 | 值 |
|----|----|
| 框架 | 微信小程序原生（wxml + wxss + js） |
| UI | 无第三方框架，纯手写 |
| 数据存储 | `wx.setStorageSync` / `wx.getStorageSync` |
| 状态管理 | Page data + Storage |
| 主题系统 | CSS 类名切换（`.theme-dark`） |
| 导航 | 自定义 TabBar 组件 |
| 后端 | 无 |
| 云服务 | 无 |

---

## 4. 项目结构

```
/
├── app.js                        // 入口：主题管理（getActualTheme）
├── app.json                      // 全局配置：页面路由、TabBar
├── app.wxss                      // 全局样式（极少量）
├── project.config.json           // 项目配置
│
├── utils/
│   └── settings.js               // ⭐ 核心工具：数据读写、预设管理、存储空间
│
├── custom-tab-bar/               // 自定义 TabBar 组件
│   ├── index.js / .wxml / .wxss / .json
│
├── images/                       // TabBar 图标
├── img/                          // 用户图片（头像等）
│
├── pages/
│   ├── index/                    // ⭐ 首页：分类Tab + 搜索 + 物品列表
│   ├── add/                      // ⭐ 新增：表单 + 特殊物品开关 + 日期选择
│   ├── detail/                   // 详情：查看 / 编辑 / 删除 / 库存加减
│   └── mine/                     // 设置：主题 / 位置 / 分类 / 存储 / 名片卡
│
└── docx/                         // 项目文档（见第7节）
```

---

## 5. 关键数据结构

### 5.1 Storage Key

| Key | 用途 |
|-----|------|
| `home_items` | 物品数据 `{ items: Item[] }` |
| `app_settings` | 设置数据 `{ theme, locations, categories }` |

### 5.2 Item 字段

```javascript
{
  id: "item_170000000001",      // string, 唯一ID
  name: "5号电池",               // string, 必填
  location: "客厅 / 电视柜",    // string, 必填
  count: 8,                      // number, 默认1
  unit: "节",                    // string, 可选
  category: "日用品",            // string, 可选
  note: "遥控器用",              // string, 可选, max 250字符
  createdAt: 1700000000,         // number, 秒级时间戳
  updatedAt: 1700000500,         // number, 秒级时间戳
  isSpecial: false,              // boolean, 是否特殊物品
  expireAt: null,                // number|null, 毫秒时间戳, isSpecial=true时必填
  history: [                     // array, 最多20条
    { delta: -2, after: 6, time: 1700000600 }
  ]
}
```

### 5.3 到期状态计算规则

```
距离到期 > 30天   → normal  （默认样式）
距离到期 8-30天   → warning （黄色, .expire-warning）
距离到期 ≤ 7天    → danger  （红色, .expire-danger）
已过期           → expired （灰色半透明, .expire-expired, 排序置底）
```

---

## 6. 已解决的问题与陷阱

### ⚠️ 问题1：特殊物品保存后 isSpecial 为 undefined
- **根因：** `add.js` 的 `onSave` 方法未将 `isSpecial` 和 `expireAt` 写入 `newItem` 对象
- **修复：** 在解构时加入 `isSpecial, expireDate`，在 newItem 中添加 `isSpecial` 和 `expireAt` 字段
- **教训：** 新增数据字段时，务必同步修改保存逻辑

### ⚠️ 问题2：特殊物品不显示在对应Tab
- **根因：** 同上（isSpecial 未保存导致 filter 失败）
- **修复：** 修复保存逻辑后自动生效
- **调试方法：** 在控制台执行 `wx.getStorageSync('home_items')` 检查实际数据

### ⚠️ 问题3：日期选择器超出页面右侧
- **根因：** `.form-picker` 样式缺少 `box-sizing: border-box` 和合理的 padding
- **修复：** 统一与 `.form-select` 相同的样式规范

### ⚠️ 问题4：图片加载失败（500错误）
- **根因：** 使用了系统绝对路径 `/Users/.../img/DOG.JPG`
- **修复：** 改为小程序根目录相对路径 `/img/dog.jpg`
- **规则：** 微信小程序中图片路径必须以 `/` 开头表示项目根目录

### ⚠️ 通用注意事项
- **不要使用 Web API**（如 document、window）
- **不要使用第三方 UI 框架**
- **路径使用 `/` 开头的项目相对路径**
- **时间戳：** createdAt/updatedAt 用秒级，expireAt 用毫秒级
- **暗色模式：** 每个页面/组件样式末尾都有 `.theme-dark` 开头的覆盖样式

---

## 7. docx 目录文档索引

| 文档 | 用途 | 优先级 |
|------|------|--------|
| **Agent_Instructions.md** | 本文档，AI Agent 快速入手 | ⭐⭐⭐ 最先读 |
| **PRD.md** | 产品需求文档，功能定义与验收标准 | ⭐⭐ 需求不清楚时读 |
| **TECH_DESIGN.md** | 技术设计文档，架构、数据模型、接口 | ⭐⭐ 技术方案参考 |
| **AGENT.md** | 早期 AI Agent 指令文档（含代码示例） | ⭐ 补充参考 |
| **SPECIAL_ITEMS_FEATURE.md** | 特殊物品到期管理完整设计文档 | ⭐ 修改该功能时读 |
| **CODE_REFERENCE.md** | 特殊物品功能代码速查清单 | ⭐ 快速查代码片段 |
| **IMPLEMENTATION_SUMMARY.md** | v1.1 实现总结与变更清单 | ⭐ 了解改了什么 |
| **DEBUG_GUIDE.md** | 特殊物品分类显示问题调试指南 | ⭐ 遇到类似Bug时读 |

---

## 8. 阅读优先级建议

### 场景A：首次接触项目
```
1. 本文档 (Agent_Instructions.md)     — 全貌
2. app.json                           — 页面路由、TabBar 配置
3. pages/index/index.js + .wxml       — 首页逻辑和UI
4. utils/settings.js                  — 数据工具函数
```

### 场景B：修改/新增功能
```
1. 本文档第5节（数据结构）
2. PRD.md（需求定义）
3. TECH_DESIGN.md（技术细节）
4. 对应 pages/ 目录下的 js + wxml + wxss
```

### 场景C：排查Bug
```
1. 本文档第6节（已知问题）
2. DEBUG_GUIDE.md
3. 控制台执行: wx.getStorageSync('home_items') 查看实际数据
4. 对应页面的 js 文件
```

### 场景D：样式/UI调整
```
1. 对应页面的 wxss 文件
2. 注意检查 .theme-dark 暗色模式适配
3. 确保 box-sizing: border-box
```

---

## 9. Token 使用优化建议

### 避免扫描
- ❌ node_modules（项目无此目录）
- ❌ .git/
- ❌ images/（仅含 TabBar PNG 图标）
- ❌ project.config.json / project.private.config.json
- ❌ 全局 app.wxss（内容极少）

### 优先读取
- ✅ app.json — 页面路由和 TabBar 配置
- ✅ pages/index/ — 首页核心逻辑
- ✅ pages/add/add.js — 新增物品保存逻辑
- ✅ utils/settings.js — 数据层工具函数
- ✅ docx/Agent_Instructions.md — 本文档

### 按需读取
- 📄 pages/detail/ — 仅修改详情页时
- 📄 pages/mine/ — 仅修改设置页时
- 📄 custom-tab-bar/ — 仅修改底部导航时
- 📄 各页面 .wxss — 仅涉及样式问题时

---

## 10. 后续协作注意事项

1. **这是微信小程序项目**，不是 Web/React/Vue 项目
2. **所有 API 使用 `wx.` 前缀**（如 `wx.setStorageSync`、`wx.navigateTo`、`wx.showToast`）
3. **页面结构固定为** `.js` + `.json` + `.wxml` + `.wxss` 四件套
4. **数据绑定用** `{{}}` 语法，事件用 `bind` 前缀（如 `bindtap`）
5. **列表渲染用** `wx:for` + `wx:key`
6. **条件渲染用** `wx:if`
7. **暗色模式**：容器上有 `{{darkMode ? 'theme-dark' : ''}}` 类名切换
8. **新增字段时**：必须同步修改**保存逻辑**和**展示逻辑**
9. **图片路径**：使用 `/img/xxx` 格式，不能使用系统绝对路径
10. **修改代码后**：不需要创建新的 markdown 文档来记录，除非用户明确要求

---

**文档状态：** 已完成
**适用版本：** v1.1
