// pages/detail/detail.js
const STORAGE_KEY = 'home_items';
const settingsUtil = require('../../utils/settings.js');

Page({
  data: {
    darkMode: false,    // 当前是否为暗色模式
    item: null,         // 当前物品
    itemId: '',         // 物品ID
    isEditing: false,   // 是否处于编辑模式
    editData: {},       // 编辑中的数据
    noteExpanded: false, // 备注是否展开
    showUnitField: false, // 是否显示单位输入框
    initialCount: 0,    // 进入页面时的初始数量（用于记录库存变更）
    countAnimate: false, // 数量变化动画
    // 选择器相关
    allLocations: [],
    allCategories: [],
    showLocationPicker: false,
    showCategoryPicker: false,
    showAddLocationInput: false,
    showAddCategoryInput: false,
    newLocationInput: '',
    newCategoryInput: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadItem(options.id);
    }
    this.loadOptions();
    this.updateThemeState();
  },

  onShow: function () {
    // 每次显示页面时重新加载数据
    if (this.data.itemId) {
      this.loadItem(this.data.itemId);
    }
    this.loadOptions();
    this.updateThemeState();
  },

  /**
   * 更新主题状态
   */
  updateThemeState: function () {
    const app = getApp();
    const actualTheme = app.getActualTheme ? app.getActualTheme() : 'light';
    this.setData({ darkMode: actualTheme === 'dark' });

    // 同步更新导航栏颜色
    if (actualTheme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1a1a1a'
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    }
  },

  /**
   * 加载选项数据
   */
  loadOptions: function () {
    this.setData({
      allLocations: settingsUtil.getAllLocations(),
      allCategories: settingsUtil.getAllCategories()
    });
  },

  /**
   * 从本地存储加载物品
   */
  loadItem: function (id) {
    try {
      const data = wx.getStorageSync(STORAGE_KEY) || { items: [] };
      const items = data.items || [];
      const item = items.find(i => i.id === id);

      if (item) {
        this.setData({
          item: item,
          editData: { ...item },
          initialCount: item.count  // 记录初始数量
        });
      } else {
        wx.showToast({
          title: '物品不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (e) {
      console.error('读取物品失败:', e);
    }
  },

  /**
   * 保存物品到本地存储
   */
  saveItem: function (updatedItem) {
    try {
      const data = wx.getStorageSync(STORAGE_KEY) || { items: [] };
      const items = data.items || [];
      const index = items.findIndex(i => i.id === updatedItem.id);

      if (index !== -1) {
        updatedItem.updatedAt = Math.floor(Date.now() / 1000);
        items[index] = updatedItem;
        wx.setStorageSync(STORAGE_KEY, { items: items });
        this.setData({ item: updatedItem });
        return true;
      }
      return false;
    } catch (e) {
      console.error('保存物品失败:', e);
      return false;
    }
  },

  /**
   * 数量减一
   */
  onDecrease: function () {
    const item = this.data.item;
    if (item.count > 0) {
      item.count = item.count - 1;
      if (this.saveItem(item)) {
        this.setData({ item: item });
        this.triggerCountAnimation();
      }
    }
  },

  /**
   * 数量加一
   */
  onIncrease: function () {
    const item = this.data.item;
    item.count = item.count + 1;
    if (this.saveItem(item)) {
      this.setData({ item: item });
      this.triggerCountAnimation();
    }
  },

  /**
   * 触发数量跳动动画
   */
  triggerCountAnimation: function () {
    this.setData({ countAnimate: true });
    setTimeout(() => {
      this.setData({ countAnimate: false });
    }, 260);
  },

  /**
   * 页面卸载时记录库存变更
   */
  onUnload: function () {
    this.recordHistoryIfChanged();
  },

  /**
   * 检查并记录库存变更
   */
  recordHistoryIfChanged: function () {
    const item = this.data.item;
    const initialCount = this.data.initialCount;

    if (!item) return;

    const delta = item.count - initialCount;
    if (delta === 0) return;  // 数量未变化，不记录

    // 记录库存变更
    this.addHistory(item, delta);
    this.saveItem(item);
  },

  /**
   * 添加库存变更记录
   */
  addHistory: function (item, delta) {
    if (!item.history) {
      item.history = [];
    }
    // 添加新记录
    item.history.push({
      delta: delta,
      after: item.count,
      time: Math.floor(Date.now() / 1000)
    });
    // 只保留最近20条记录
    if (item.history.length > 20) {
      item.history = item.history.slice(-20);
    }
  },

  /**
   * 进入编辑模式
   */
  onEdit: function () {
    this.setData({
      isEditing: true,
      editData: { ...this.data.item }
    });
  },

  /**
   * 取消编辑
   */
  onCancelEdit: function () {
    this.setData({
      isEditing: false,
      editData: { ...this.data.item }
    });
  },

  /**
   * 编辑时输入名称
   */
  onNameInput: function (e) {
    this.setData({ 'editData.name': e.detail.value });
  },

  /**
   * 编辑时输入单位
   */
  onUnitInput: function (e) {
    this.setData({ 'editData.unit': e.detail.value });
  },

  // ========== 位置选择器相关 ==========
  /**
   * 显示位置选择器
   */
  openLocationPicker: function () {
    this.setData({ showLocationPicker: true });
  },

  /**
   * 关闭位置选择器
   */
  closeLocationPicker: function () {
    this.setData({
      showLocationPicker: false,
      showAddLocationInput: false,
      newLocationInput: ''
    });
  },

  /**
   * 选择位置
   */
  onSelectLocation: function (e) {
    const location = e.currentTarget.dataset.value;
    this.setData({
      'editData.location': location,
      showLocationPicker: false,
      showAddLocationInput: false,
      newLocationInput: ''
    });
  },

  /**
   * 显示添加位置输入框
   */
  showAddLocation: function () {
    this.setData({ showAddLocationInput: true });
  },

  /**
   * 新位置输入
   */
  onNewLocationInput: function (e) {
    this.setData({ newLocationInput: e.detail.value });
  },

  /**
   * 确认添加新位置
   */
  confirmAddLocation: function () {
    const newLocation = this.data.newLocationInput.trim();
    if (!newLocation) {
      wx.showToast({ title: '请输入位置名称', icon: 'none' });
      return;
    }

    // 检查是否已存在
    if (this.data.allLocations.includes(newLocation)) {
      wx.showToast({ title: '该位置已存在', icon: 'none' });
      return;
    }

    // 检查存储空间
    if (!settingsUtil.hasEnoughStorage()) {
      wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
      return;
    }

    // 添加到自定义位置
    settingsUtil.addCustomLocation(newLocation);

    this.setData({
      allLocations: settingsUtil.getAllLocations(),
      'editData.location': newLocation,
      showLocationPicker: false,
      showAddLocationInput: false,
      newLocationInput: ''
    });

    wx.showToast({ title: '已添加新位置', icon: 'success' });
  },

  // ========== 分类选择器相关 ==========
  /**
   * 显示分类选择器
   */
  openCategoryPicker: function () {
    this.setData({ showCategoryPicker: true });
  },

  /**
   * 关闭分类选择器
   */
  closeCategoryPicker: function () {
    this.setData({
      showCategoryPicker: false,
      showAddCategoryInput: false,
      newCategoryInput: ''
    });
  },

  /**
   * 选择分类
   */
  onSelectCategory: function (e) {
    const category = e.currentTarget.dataset.value;
    this.setData({
      'editData.category': category,
      showCategoryPicker: false,
      showAddCategoryInput: false,
      newCategoryInput: ''
    });
  },

  /**
   * 显示添加分类输入框
   */
  showAddCategory: function () {
    this.setData({ showAddCategoryInput: true });
  },

  /**
   * 新分类输入
   */
  onNewCategoryInput: function (e) {
    this.setData({ newCategoryInput: e.detail.value });
  },

  /**
   * 确认添加新分类
   */
  confirmAddCategory: function () {
    const newCategory = this.data.newCategoryInput.trim();
    if (!newCategory) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    // 检查是否已存在
    if (this.data.allCategories.includes(newCategory)) {
      wx.showToast({ title: '该分类已存在', icon: 'none' });
      return;
    }

    // 检查存储空间
    if (!settingsUtil.hasEnoughStorage()) {
      wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
      return;
    }

    // 添加到自定义分类
    settingsUtil.addCustomCategory(newCategory);

    this.setData({
      allCategories: settingsUtil.getAllCategories(),
      'editData.category': newCategory,
      showCategoryPicker: false,
      showAddCategoryInput: false,
      newCategoryInput: ''
    });

    wx.showToast({ title: '已添加新分类', icon: 'success' });
  },

  /**
   * 编辑时输入备注
   */
  onNoteInput: function (e) {
    this.setData({ 'editData.note': e.detail.value });
  },

  /**
   * 切换备注展开/收起
   */
  toggleNoteExpand: function () {
    this.setData({ noteExpanded: !this.data.noteExpanded });
  },

  /**
   * 显示单位输入框
   */
  showUnitFieldTap: function () {
    this.setData({ showUnitField: true });
  },

  /**
   * 隐藏单位输入框
   */
  hideUnitField: function () {
    this.setData({ showUnitField: false, 'editData.unit': '' });
  },

  /**
   * 保存编辑
   */
  onSaveEdit: function () {
    const editData = this.data.editData;

    // 校验必填字段
    if (!editData.name || editData.name.trim() === '') {
      wx.showToast({
        title: '请输入物品名称',
        icon: 'none'
      });
      return;
    }

    if (!editData.location || editData.location.trim() === '') {
      wx.showToast({
        title: '请输入存放位置',
        icon: 'none'
      });
      return;
    }

    // 更新物品
    const updatedItem = {
      ...this.data.item,
      name: editData.name.trim(),
      unit: (editData.unit || '').trim(),
      location: editData.location.trim(),
      category: (editData.category || '').trim(),
      note: (editData.note || '').trim()
    };

    if (this.saveItem(updatedItem)) {
      wx.showToast({
        title: '已经帮你改好啦～',
        icon: 'success'
      });
      this.setData({
        isEditing: false,
        item: updatedItem
      });
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 删除物品
   */
  onDelete: function () {
    wx.showModal({
      title: '确认删除',
      content: '确定要把这个物品从家里移除吗？',
      confirmText: '删除',
      confirmColor: '#d4847a',
      success: (res) => {
        if (res.confirm) {
          this.deleteItem();
        }
      }
    });
  },

  /**
   * 执行删除
   */
  deleteItem: function () {
    try {
      const data = wx.getStorageSync(STORAGE_KEY) || { items: [] };
      const items = data.items || [];
      const newItems = items.filter(i => i.id !== this.data.itemId);

      wx.setStorageSync(STORAGE_KEY, { items: newItems });

      wx.showToast({
        title: '已移除～',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (e) {
      console.error('删除失败:', e);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  }
})