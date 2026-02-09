// pages/index/index.js
const STORAGE_KEY = 'home_items';

Page({
    data: {
        darkMode: false,       // 当前是否为暗色模式
        items: [],             // 全部物品列表
        filteredItems: [],     // 过滤后的物品列表（已废弃，使用下面分类的）
        searchText: '',        // 搜索关键词
        isEmpty: true,         // 是否为空列表
        // 分类后的物品列表
        normalItems: [],       // 常规物品列表
        specialItems: [],      // 特殊物品列表（有到期时间）
        // 标签页切换
        currentTab: 0          // 当前选中的标签：0-常规物品，1-特殊物品
    },

    onLoad: function () {
        // 首次加载时立即设置主题状态，避免页面闪烁
        this.updateThemeState();
        this.loadItems();
    },

    onShow: function () {
        // 每次页面显示时重新加载数据，确保数据最新
        this.loadItems();
        // 更新主题状态
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
                selected: 0,
                darkMode: actualTheme === 'dark'
            });
        }
    },

    /**
     * 切换标签页
     */
    onTabChange: function (e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ currentTab: tab });
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
     * 从本地存储加载物品列表
     */
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
    },

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
    },

    /**
     * 搜索框输入事件
     */
    onSearchInput: function (e) {
        const searchText = e.detail.value;
        this.setData({ searchText: searchText });
        this.filterItems(searchText);
    },

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
    },

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
    },

    /**
     * 根据关键词过滤物品列表
     * 匹配字段：name, location, category, note
     */
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

    /**
     * 清空搜索框
     */
    onClearSearch: function () {
        this.setData({
            searchText: ''
        });
        this.filterItems('');
    },

    /**
     * 点击物品，跳转到详情页
     */
    onItemTap: function (e) {
        const itemId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/detail/detail?id=' + itemId
        });
    },

    /**
     * 跳转到新增物品页面
     */
    onAddItem: function () {
        wx.navigateTo({
            url: '/pages/add/add'
        });
    },

    /**
     * 判断数量是否较低（<=2）
     */
    isLowCount: function (count) {
        return count <= 2;
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
});
