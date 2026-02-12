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
        newCategory: '',
        // 存储信息
        storageUnit: 'MB', // MB 或 KB
        storageUsedMB: '0.00',
        storageUsedKB: '0',
        storageLimitMB: '10',
        storageLimitKB: '10240',
        storagePercentage: '0.0'
    },

    onLoad: function () {
        this.loadSettings();
        this.loadStorageInfo();
        this.updateThemeState();
    },

    onShow: function () {
        this.loadSettings();
        this.loadStorageInfo();
        this.updateThemeState();
        // 更新自定义tabBar状态
        this.updateTabBar();
    },

    /**
     * 更新自定义tabBar状态
     */
    updateTabBar: function () {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            const app = getApp();
            const actualTheme = app.getActualTheme ? app.getActualTheme() : 'light';
            this.getTabBar().setData({
                selected: 1,
                darkMode: actualTheme === 'dark'
            });
        }
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
     * 加载存储信息
     */
    loadStorageInfo: function () {
        const info = settingsUtil.getStorageInfo();
        this.setData({
            storageUsedMB: info.usedMB,
            storageUsedKB: info.usedKB.toString(),
            storageLimitMB: info.limitMB,
            storageLimitKB: info.limitKB.toString(),
            storagePercentage: info.percentage
        });
    },

    /**
     * 切换存储单位
     */
    toggleStorageUnit: function () {
        const newUnit = this.data.storageUnit === 'MB' ? 'KB' : 'MB';
        this.setData({ storageUnit: newUnit });
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
            // 立即更新tabBar主题
            this.updateTabBar();
            wx.showToast({
                title: '已切换～',
                icon: 'success'
            });
        }
    },

    /**
     * 清除所有数据（一键清除）
     */
    onClearAllData: function () {
        wx.showModal({
            title: '⚠️ 确认清除',
            content: '这将清除所有物品记录和自定义设置，此操作不可恢复！',
            confirmText: '确认清除',
            confirmColor: '#d4847a',
            success: (res) => {
                if (res.confirm) {
                    // 二次确认
                    wx.showModal({
                        title: '再次确认',
                        content: '真的要删除所有数据吗？',
                        confirmText: '删除',
                        confirmColor: '#d4847a',
                        success: (res2) => {
                            if (res2.confirm) {
                                if (settingsUtil.clearAllData()) {
                                    this.loadSettings();
                                    this.loadStorageInfo();
                                    wx.showToast({
                                        title: '已清除所有数据',
                                        icon: 'success'
                                    });
                                } else {
                                    wx.showToast({
                                        title: '清除失败',
                                        icon: 'none'
                                    });
                                }
                            }
                        }
                    });
                }
            }
        });
    },

    /**
     * 仅清除物品数据
     */
    onClearItemsData: function () {
        wx.showModal({
            title: '确认清除',
            content: '这将清除所有物品记录，但保留自定义位置和分类设置。',
            confirmText: '确认清除',
            confirmColor: '#d4847a',
            success: (res) => {
                if (res.confirm) {
                    if (settingsUtil.clearItemsData()) {
                        this.loadStorageInfo();
                        wx.showToast({
                            title: '已清除物品数据',
                            icon: 'success'
                        });
                    } else {
                        wx.showToast({
                            title: '清除失败',
                            icon: 'none'
                        });
                    }
                }
            }
        });
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
        // 检查存储空间
        if (!settingsUtil.hasEnoughStorage()) {
            wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
            return;
        }
        if (settingsUtil.addCustomLocation(location)) {
            this.loadSettings();
            this.loadStorageInfo();
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
        // 检查存储空间
        if (!settingsUtil.hasEnoughStorage()) {
            wx.showToast({ title: '存储空间不足，请清理数据', icon: 'none' });
            return;
        }
        if (settingsUtil.addCustomCategory(category)) {
            this.loadSettings();
            this.loadStorageInfo();
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
    },

    /**
     * 复制 GitHub 链接
     */
    onCopyGitHubLink: function () {
        const link = 'https://github.com/KennyZou4468?tab=repositories';
        wx.setClipboardData({
            data: link,
            success: () => {
                wx.showToast({
                    title: '链接已复制～',
                    icon: 'success',
                    duration: 2000
                });
            },
            fail: () => {
                wx.showToast({
                    title: '复制失败，请重试',
                    icon: 'none'
                });
            }
        });
    }
});
