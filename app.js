// app.js
const settingsUtil = require('./utils/settings.js');

App({
    onLaunch: function () {
        // 小程序启动时执行
        console.log('家庭物品管理小程序已启动');
        // 初始化主题
        this.initTheme();
    },

    globalData: {
        theme: 'light', // 当前实际主题：light 或 dark
        elderMode: false // 老人关怀模式状态
    },

    /**
     * 初始化主题
     */
    initTheme: function () {
        const themeSetting = settingsUtil.getTheme();
        this.applyTheme(themeSetting);
        // 恢复老人关怀模式状态
        this.globalData.elderMode = settingsUtil.getElderMode();
    },

    /**
     * 应用主题
     * @param {string} themeSetting - system / light / dark
     */
    applyTheme: function (themeSetting) {
        let actualTheme = 'light';

        if (themeSetting === 'dark') {
            actualTheme = 'dark';
        } else if (themeSetting === 'system') {
            // 获取系统主题
            try {
                const appBaseInfo = wx.getAppBaseInfo();
                actualTheme = appBaseInfo.theme === 'dark' ? 'dark' : 'light';
            } catch (e) {
                // 如果新API不可用，尝试使用旧API
                try {
                    const systemInfo = wx.getSystemInfoSync();
                    actualTheme = systemInfo.theme === 'dark' ? 'dark' : 'light';
                } catch (e2) {
                    actualTheme = 'light';
                }
            }
        } else {
            actualTheme = 'light';
        }

        this.globalData.theme = actualTheme;

        // 设置页面背景色
        if (actualTheme === 'dark') {
            wx.setBackgroundColor({
                backgroundColor: '#1a1a1a',
                backgroundColorTop: '#1a1a1a',
                backgroundColorBottom: '#1a1a1a'
            });
            wx.setNavigationBarColor({
                frontColor: '#ffffff',
                backgroundColor: '#1a1a1a'
            });
            // 设置TabBar暗色样式
            wx.setTabBarStyle({
                color: '#888888',
                selectedColor: '#ff9a6c',
                backgroundColor: '#1a1a1a',
                borderStyle: 'black'
            });
        } else {
            wx.setBackgroundColor({
                backgroundColor: '#faf8f5',
                backgroundColorTop: '#faf8f5',
                backgroundColorBottom: '#faf8f5'
            });
            wx.setNavigationBarColor({
                frontColor: '#000000',
                backgroundColor: '#faf8f5'
            });
            // 设置TabBar浅色样式
            wx.setTabBarStyle({
                color: '#999999',
                selectedColor: '#ff9a6c',
                backgroundColor: '#ffffff',
                borderStyle: 'white'
            });
        }
    },

    /**
     * 获取当前实际主题
     */
    getActualTheme: function () {
        return this.globalData.theme;
    },

    /**
     * 获取老人关怀模式状态
     */
    getElderMode: function () {
        return this.globalData.elderMode || false;
    },

    /**
     * 设置老人关怀模式状态
     */
    setElderMode: function (enabled) {
        this.globalData.elderMode = enabled;
        settingsUtil.setElderMode(enabled);
    }
});
