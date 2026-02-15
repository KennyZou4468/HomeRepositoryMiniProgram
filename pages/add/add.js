// pages/add/add.js
const STORAGE_KEY = 'home_items';
const settingsUtil = require('../../utils/settings.js');

Page({
  data: {
    darkMode: false,    // 当前是否为暗色模式
    elderMode: false,   // 老人关怀模式
    name: '',           // 物品名称（必填）
    count: 1,           // 数量（默认1）
    unit: '',           // 单位（可选）
    location: '',       // 存放位置（必填）
    category: '',       // 分类（可选）
    note: '',           // 备注（可选）
    showUnitField: false, // 是否显示单位输入框
    // 特殊物品相关字段
    isSpecial: false,   // 是否为特殊物品（有使用期限）
    expireDate: '',     // 到期日期（格式：YYYY-MM-DD）
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
    const app = getApp();
    this.setData({ elderMode: app.getElderMode ? app.getElderMode() : false });
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
    // 检查存储空间
    if (!settingsUtil.hasEnoughStorage()) {
      wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
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
    // 检查存储空间
    if (!settingsUtil.hasEnoughStorage()) {
      wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
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
   * 显示单位输入框
   */
  showUnitFieldTap: function () {
    this.setData({ showUnitField: true });
  },

  /**
   * 隐藏单位输入框
   */
  hideUnitField: function () {
    this.setData({ showUnitField: false, unit: '' });
  },

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
    const { name, count, unit, location, category, note, isSpecial, expireDate } = this.data;

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

    // 如果是特殊物品，必须选择到期日期
    if (isSpecial && (!expireDate || expireDate.trim() === '')) {
      wx.showToast({
        title: '请选择到期日期',
        icon: 'none'
      });
      return;
    }

    // 检查存储空间
    if (!settingsUtil.hasEnoughStorage()) {
      wx.showModal({
        title: '存储空间不足',
        content: '本地存储空间即将用尽，请前往「我的」页面清理数据后再添加新物品。',
        confirmText: '去清理',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/mine/mine'
            });
          }
        }
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
      updatedAt: now,
      // 特殊物品相关字段
      isSpecial: isSpecial || false,
      expireAt: isSpecial && expireDate ? new Date(expireDate).getTime() : null
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
  },

  /**
   * 转发给朋友
   */
  onShareAppMessage: function () {
    return {
      title: '家庭物品管理 - 轻松找到家里的每一件物品',
      path: '/pages/index/index',
      imageUrl: '' // 可以设置分享图片
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function () {
    return {
      title: '家庭物品管理 - 轻松找到家里的每一件物品',
      query: '',
      imageUrl: '' // 可以设置分享图片
    };
  }
})