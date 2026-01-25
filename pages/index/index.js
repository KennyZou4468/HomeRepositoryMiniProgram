// pages/index/index.js
const STORAGE_KEY = 'home_items';

Page({
    data: {
        darkMode: false,    // 当前是否为暗色模式
        items: [],          // 全部物品列表
        filteredItems: [],  // 过滤后的物品列表
        searchText: '',     // 搜索关键词
        isEmpty: true       // 是否为空列表
    },

    onLoad: function () {
        this.loadItems();
    },

    onShow: function () {
        // 每次页面显示时重新加载数据，确保数据最新
        this.loadItems();
        // 更新主题状态
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
     * 从本地存储加载物品列表
     */
    loadItems: function () {
        try {
            const data = wx.getStorageSync(STORAGE_KEY);
            const items = (data && data.items) ? data.items : [];
            this.setData({
                items: items,
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
                filteredItems: [],
                isEmpty: true
            });
        }
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
     * 根据关键词过滤物品列表
     * 匹配字段：name, location, note
     */
    filterItems: function (keyword) {
        if (!keyword || keyword.trim() === '') {
            this.setData({
                filteredItems: this.data.items,
                isEmpty: this.data.items.length === 0
            });
            return;
        }

        const lowerKeyword = keyword.toLowerCase().trim();
        const filtered = this.data.items.filter(item => {
            const name = (item.name || '').toLowerCase();
            const location = (item.location || '').toLowerCase();
            const note = (item.note || '').toLowerCase();
            return name.includes(lowerKeyword) ||
                location.includes(lowerKeyword) ||
                note.includes(lowerKeyword);
        });

        this.setData({
            filteredItems: filtered,
            isEmpty: filtered.length === 0 && this.data.items.length === 0
        });
    },

    /**
     * 清空搜索框
     */
    onClearSearch: function () {
        this.setData({
            searchText: '',
            filteredItems: this.data.items,
            isEmpty: this.data.items.length === 0
        });
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
    }
});
