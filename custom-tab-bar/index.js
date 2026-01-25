Component({
    data: {
        selected: 0,
        darkMode: false,
        color: "#999999",
        selectedColor: "#ff9a6c",
        list: [
            {
                pagePath: "/pages/index/index",
                text: "首页",
                iconPath: "/images/home.png",
                selectedIconPath: "/images/home-active.png"
            },
            {
                pagePath: "/pages/mine/mine",
                text: "我的",
                iconPath: "/images/mine.png",
                selectedIconPath: "/images/mine-active.png"
            }
        ]
    },

    attached() {
        this.updateTheme();
    },

    methods: {
        switchTab(e) {
            const data = e.currentTarget.dataset;
            const url = data.path;
            wx.switchTab({ url });
        },

        updateTheme() {
            const app = getApp();
            if (app && app.getActualTheme) {
                const actualTheme = app.getActualTheme();
                this.setData({ darkMode: actualTheme === 'dark' });
            }
        }
    }
});
