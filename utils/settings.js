// utils/settings.js
// 设置管理工具函数

const SETTINGS_KEY = 'app_settings';

// 预设存放位置
const PRESET_LOCATIONS = [
    '客厅',
    '主人卧室',
    '次卧',
    '厨房',
    '卫生间',
    '阳台',
    '餐厅'
];

// 预设物品分类
const PRESET_CATEGORIES = [
    '日用品',
    '清洁用品',
    '厨房用品',
    '食品 / 零食',
    '药品 / 医疗',
    '电子产品',
    '充电 / 电池',
    '衣物 / 布料',
    '工具 / 五金',
    '文件 / 证件',
    '宠物用品',
    '其他'
];

/**
 * 获取默认设置
 */
function getDefaultSettings() {
    return {
        theme: 'system', // system | light | dark
        locations: {
            preset: PRESET_LOCATIONS,
            custom: []
        },
        categories: {
            preset: PRESET_CATEGORIES,
            custom: []
        }
    };
}

/**
 * 获取设置
 */
function getSettings() {
    try {
        const settings = wx.getStorageSync(SETTINGS_KEY);
        if (settings) {
            // 合并默认值，确保结构完整
            const defaultSettings = getDefaultSettings();
            return {
                theme: settings.theme || defaultSettings.theme,
                locations: {
                    preset: PRESET_LOCATIONS, // 预设始终使用最新
                    custom: settings.locations?.custom || []
                },
                categories: {
                    preset: PRESET_CATEGORIES, // 预设始终使用最新
                    custom: settings.categories?.custom || []
                }
            };
        }
        return getDefaultSettings();
    } catch (e) {
        console.error('读取设置失败:', e);
        return getDefaultSettings();
    }
}

/**
 * 保存设置
 */
function saveSettings(settings) {
    try {
        wx.setStorageSync(SETTINGS_KEY, settings);
        return true;
    } catch (e) {
        console.error('保存设置失败:', e);
        return false;
    }
}

/**
 * 获取所有位置（预设 + 自定义）
 */
function getAllLocations() {
    const settings = getSettings();
    return [...settings.locations.preset, ...settings.locations.custom];
}

/**
 * 获取所有分类（预设 + 自定义）
 */
function getAllCategories() {
    const settings = getSettings();
    return [...settings.categories.preset, ...settings.categories.custom];
}

/**
 * 添加自定义位置
 */
function addCustomLocation(location) {
    if (!location || location.trim() === '') return false;
    const settings = getSettings();
    const trimmed = location.trim();
    // 检查是否已存在
    if (settings.locations.preset.includes(trimmed) ||
        settings.locations.custom.includes(trimmed)) {
        return false;
    }
    settings.locations.custom.push(trimmed);
    return saveSettings(settings);
}

/**
 * 删除自定义位置
 */
function removeCustomLocation(location) {
    const settings = getSettings();
    const index = settings.locations.custom.indexOf(location);
    if (index > -1) {
        settings.locations.custom.splice(index, 1);
        return saveSettings(settings);
    }
    return false;
}

/**
 * 添加自定义分类
 */
function addCustomCategory(category) {
    if (!category || category.trim() === '') return false;
    const settings = getSettings();
    const trimmed = category.trim();
    // 检查是否已存在
    if (settings.categories.preset.includes(trimmed) ||
        settings.categories.custom.includes(trimmed)) {
        return false;
    }
    settings.categories.custom.push(trimmed);
    return saveSettings(settings);
}

/**
 * 删除自定义分类
 */
function removeCustomCategory(category) {
    const settings = getSettings();
    const index = settings.categories.custom.indexOf(category);
    if (index > -1) {
        settings.categories.custom.splice(index, 1);
        return saveSettings(settings);
    }
    return false;
}

/**
 * 获取主题设置
 */
function getTheme() {
    const settings = getSettings();
    return settings.theme;
}

/**
 * 设置主题
 */
function setTheme(theme) {
    const settings = getSettings();
    settings.theme = theme;
    return saveSettings(settings);
}

module.exports = {
    PRESET_LOCATIONS,
    PRESET_CATEGORIES,
    getSettings,
    saveSettings,
    getAllLocations,
    getAllCategories,
    addCustomLocation,
    removeCustomLocation,
    addCustomCategory,
    removeCustomCategory,
    getTheme,
    setTheme
};
