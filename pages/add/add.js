// pages/add/add.js
const STORAGE_KEY = 'home_items';
const settingsUtil = require('../../utils/settings.js');

Page({
  data: {
    darkMode: false,    // 当前是否为暗色模式
    name: '',           // 物品名称（必填）
    count: 1,           // 数量（默认1）
    unit: '',           // 单位（可选）
    location: '',       // 存放位置（必填）
    category: '',       // 分类（可选）
    note: '',           // 备注（可选）
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

  onLoad: function () {
    this.loadOptions();
    this.updateThemeState();
  },

  onShow: function () {
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
   * 输入物品名称
   */
  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 输入数量
   */
  onCountInput: function (e) {
    const value = e.detail.value;
    // 只允许正整数
    const count = parseInt(value) || '';
    this.setData({ count: count });
  },

  /**
   * 输入单位
   */
  onUnitInput: function (e) {
    this.setData({ unit: e.detail.value });
  },

  // ========== 位置选择器 ==========
  showLocationPicker: function () {
    this.setData({ showLocationPicker: true });
  },

  hideLocationPicker: function () {
    this.setData({ showLocationPicker: false, showAddLocationInput: false, newLocationInput: '' });
  },

  selectLocation: function (e) {
    const location = e.currentTarget.dataset.location;
    this.setData({
      location: location,
      showLocationPicker: false,
      showAddLocationInput: false,
      newLocationInput: ''
    });
  },

  showAddLocationInput: function () {
    this.setData({ showAddLocationInput: true });
  },

  onNewLocationInput: function (e) {
    this.setData({ newLocationInput: e.detail.value });
  },

  confirmAddLocation: function () {
    const location = this.data.newLocationInput.trim();
    if (!location) {
      wx.showToast({ title: '请输入位置名称', icon: 'none' });
      return;
    }
    if (settingsUtil.addCustomLocation(location)) {
      this.loadOptions();
      this.setData({
        location: location,
        showLocationPicker: false,
        showAddLocationInput: false,
        newLocationInput: ''
      });
      wx.showToast({ title: '已添加～', icon: 'success' });
    } else {
      wx.showToast({ title: '该位置已存在', icon: 'none' });
    }
  },

  // ========== 分类选择器 ==========
  showCategoryPicker: function () {
    this.setData({ showCategoryPicker: true });
  },

  hideCategoryPicker: function () {
    this.setData({ showCategoryPicker: false, showAddCategoryInput: false, newCategoryInput: '' });
  },

  selectCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      category: category,
      showCategoryPicker: false,
      showAddCategoryInput: false,
      newCategoryInput: ''
    });
  },

  clearCategory: function () {
    this.setData({
      category: '',
      showCategoryPicker: false
    });
  },

  showAddCategoryInput: function () {
    this.setData({ showAddCategoryInput: true });
  },

  onNewCategoryInput: function (e) {
    this.setData({ newCategoryInput: e.detail.value });
  },

  confirmAddCategory: function () {
    const category = this.data.newCategoryInput.trim();
    if (!category) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }
    if (settingsUtil.addCustomCategory(category)) {
      this.loadOptions();
      this.setData({
        category: category,
        showCategoryPicker: false,
        showAddCategoryInput: false,
        newCategoryInput: ''
      });
      wx.showToast({ title: '已添加～', icon: 'success' });
    } else {
      wx.showToast({ title: '该分类已存在', icon: 'none' });
    }
  },

  /**
   * 输入备注
   */
  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  /**
   * 生成唯一ID
   */
  generateId: function () {
    return 'item_' + Date.now() + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 保存物品
   */
  onSave: function () {
    const { name, count, unit, location, category, note } = this.data;

    // 校验必填字段
    if (!name || name.trim() === '') {
      wx.showToast({
        title: '请输入物品名称',
        icon: 'none'
      });
      return;
    }

    if (!location || location.trim() === '') {
      wx.showToast({
        title: '请选择存放位置',
        icon: 'none'
      });
      return;
    }

    // 数量为空时默认为1
    const finalCount = count === '' || count === null || count === undefined ? 1 : parseInt(count) || 1;

    // 构建新物品对象
    const now = Math.floor(Date.now() / 1000);
    const newItem = {
      id: this.generateId(),
      name: name.trim(),
      location: location.trim(),
      count: finalCount,
      unit: unit.trim(),
      category: category.trim(),
      note: note.trim(),
      createdAt: now,
      updatedAt: now
    };

    // 读取现有数据并追加新物品
    try {
      const data = wx.getStorageSync(STORAGE_KEY) || { items: [] };
      const items = data.items || [];
      items.push(newItem);

      // 保存到本地存储
      wx.setStorageSync(STORAGE_KEY, { items: items });

      // 提示保存成功
      wx.showToast({
        title: '已经帮你记好啦～',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回首页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (e) {
      console.error('保存失败:', e);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 取消并返回
   */
  onCancel: function () {
    wx.navigateBack();
  }
})