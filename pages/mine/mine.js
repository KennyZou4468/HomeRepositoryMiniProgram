// pages/mine/mine.js
const settingsUtil = require('../../utils/settings.js');

Page({
    data: {
        darkMode: false, // 当前是否为暗色模式
        theme: 'system',
        themeOptions: [
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '白天模式' },
            { value: 'dark', label: '夜间模式' }
        ],
        presetLocations: [],
        customLocations: [],
        presetCategories: [],
        customCategories: [],
        showLocationInput: false,
        showCategoryInput: false,
        newLocation: '',
        newCategory: ''
    },

    onLoad: function () {
        this.loadSettings();
        this.updateThemeState();
    },

    onShow: function () {
        this.loadSettings();
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
     * 加载设置
     */
    loadSettings: function () {
        const settings = settingsUtil.getSettings();
        this.setData({
            theme: settings.theme,
            presetLocations: settings.locations.preset,
            customLocations: settings.locations.custom,
            presetCategories: settings.categories.preset,
            customCategories: settings.categories.custom
        });
    },

    /**
     * 切换主题
     */
    onThemeChange: function (e) {
        const theme = e.currentTarget.dataset.theme;
        if (settingsUtil.setTheme(theme)) {
            this.setData({ theme: theme });
            // 通知全局更新主题
            const app = getApp();
            if (app.applyTheme) {
                app.applyTheme(theme);
            }
            // 更新本页面的暗色模式状态
            this.updateThemeState();
            wx.showToast({
                title: '已切换～',
                icon: 'success'
            });
        }
    },

    /**
     * 显示添加位置输入框
     */
    showAddLocation: function () {
        this.setData({ showLocationInput: true, newLocation: '' });
    },

    /**
     * 隐藏添加位置输入框
     */
    hideAddLocation: function () {
        this.setData({ showLocationInput: false, newLocation: '' });
    },

    /**
     * 位置输入
     */
    onLocationInput: function (e) {
        this.setData({ newLocation: e.detail.value });
    },

    /**
     * 确认添加位置
     */
    confirmAddLocation: function () {
        const location = this.data.newLocation.trim();
        if (!location) {
            wx.showToast({ title: '请输入位置名称', icon: 'none' });
            return;
        }
        if (settingsUtil.addCustomLocation(location)) {
            this.loadSettings();
            this.setData({ showLocationInput: false, newLocation: '' });
            wx.showToast({ title: '添加成功～', icon: 'success' });
        } else {
            wx.showToast({ title: '该位置已存在', icon: 'none' });
        }
    },

    /**
     * 删除自定义位置
     */
    deleteLocation: function (e) {
        const location = e.currentTarget.dataset.location;
        wx.showModal({
            title: '确认删除',
            content: `确定要删除「${location}」吗？`,
            confirmColor: '#d4847a',
            success: (res) => {
                if (res.confirm) {
                    if (settingsUtil.removeCustomLocation(location)) {
                        this.loadSettings();
                        wx.showToast({ title: '已删除～', icon: 'success' });
                    }
                }
            }
        });
    },

    /**
     * 显示添加分类输入框
     */
    showAddCategory: function () {
        this.setData({ showCategoryInput: true, newCategory: '' });
    },

    /**
     * 隐藏添加分类输入框
     */
    hideAddCategory: function () {
        this.setData({ showCategoryInput: false, newCategory: '' });
    },

    /**
     * 分类输入
     */
    onCategoryInput: function (e) {
        this.setData({ newCategory: e.detail.value });
    },

    /**
     * 确认添加分类
     */
    confirmAddCategory: function () {
        const category = this.data.newCategory.trim();
        if (!category) {
            wx.showToast({ title: '请输入分类名称', icon: 'none' });
            return;
        }
        if (settingsUtil.addCustomCategory(category)) {
            this.loadSettings();
            this.setData({ showCategoryInput: false, newCategory: '' });
            wx.showToast({ title: '添加成功～', icon: 'success' });
        } else {
            wx.showToast({ title: '该分类已存在', icon: 'none' });
        }
    },

    /**
     * 删除自定义分类
     */
    deleteCategory: function (e) {
        const category = e.currentTarget.dataset.category;
        wx.showModal({
            title: '确认删除',
            content: `确定要删除「${category}」吗？`,
            confirmColor: '#d4847a',
            success: (res) => {
                if (res.confirm) {
                    if (settingsUtil.removeCustomCategory(category)) {
                        this.loadSettings();
                        wx.showToast({ title: '已删除～', icon: 'success' });
                    }
                }
            }
        });
    }
});
