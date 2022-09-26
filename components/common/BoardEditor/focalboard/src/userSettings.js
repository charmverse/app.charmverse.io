"use strict";
exports.__esModule = true;
exports.importUserSettingsBlob = exports.exportUserSettingsBlob = exports.UserSettings = void 0;
var nativeApp_1 = require("./nativeApp");
var utils_1 = require("./utils");
// eslint-disable-next-line no-shadow
var UserSettingKey;
(function (UserSettingKey) {
    UserSettingKey["Language"] = "language";
    UserSettingKey["Theme"] = "theme";
    UserSettingKey["LastWorkspaceId"] = "lastWorkspaceId";
    UserSettingKey["LastBoardId"] = "lastBoardId";
    UserSettingKey["LastViewId"] = "lastViewId";
    UserSettingKey["EmojiMartSkin"] = "emoji-mart.skin";
    UserSettingKey["EmojiMartLast"] = "emoji-mart.last";
    UserSettingKey["EmojiMartFrequently"] = "emoji-mart.frequently";
    UserSettingKey["RandomIcons"] = "randomIcons";
    UserSettingKey["MobileWarningClosed"] = "mobileWarningClosed";
    UserSettingKey["WelcomePageViewed"] = "welcomePageViewed";
    UserSettingKey["DashboardShowEmpty"] = "dashboardShowEmpty";
})(UserSettingKey || (UserSettingKey = {}));
var UserSettings = /** @class */ (function () {
    function UserSettings() {
    }
    UserSettings.get = function (key) {
        return localStorage.getItem(key);
    };
    UserSettings.set = function (key, value) {
        if (!Object.values(UserSettingKey).includes(key)) {
            return;
        }
        if (value === null) {
            localStorage.removeItem(key);
        }
        else {
            localStorage.setItem(key, value);
        }
        (0, nativeApp_1.notifySettingsChanged)(key);
    };
    Object.defineProperty(UserSettings, "language", {
        get: function () {
            return UserSettings.get(UserSettingKey.Language);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.Language, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "welcomePageViewed", {
        get: function () {
            return UserSettings.get(UserSettingKey.WelcomePageViewed);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.WelcomePageViewed, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "theme", {
        get: function () {
            return UserSettings.get(UserSettingKey.Theme);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.Theme, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "lastWorkspaceId", {
        get: function () {
            return UserSettings.get(UserSettingKey.LastWorkspaceId);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.LastWorkspaceId, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "lastBoardId", {
        get: function () {
            return UserSettings.get(UserSettingKey.LastBoardId);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.LastBoardId, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "lastViewId", {
        get: function () {
            return UserSettings.get(UserSettingKey.LastViewId);
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.LastViewId, newValue);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "prefillRandomIcons", {
        get: function () {
            return UserSettings.get(UserSettingKey.RandomIcons) === 'true';
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.RandomIcons, JSON.stringify(newValue));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserSettings, "dashboardShowEmpty", {
        get: function () {
            return localStorage.getItem(UserSettingKey.DashboardShowEmpty) !== 'false';
        },
        set: function (newValue) {
            localStorage.setItem(UserSettingKey.DashboardShowEmpty, JSON.stringify(newValue));
        },
        enumerable: false,
        configurable: true
    });
    UserSettings.getEmojiMartSetting = function (key) {
        var prefixed = "emoji-mart.".concat(key);
        utils_1.Utils.assert(Object.values(UserSettingKey).includes(prefixed));
        var json = UserSettings.get(prefixed);
        return json ? JSON.parse(json) : null;
    };
    UserSettings.setEmojiMartSetting = function (key, value) {
        var prefixed = "emoji-mart.".concat(key);
        utils_1.Utils.assert(Object.values(UserSettingKey).includes(prefixed));
        UserSettings.set(prefixed, JSON.stringify(value));
    };
    Object.defineProperty(UserSettings, "mobileWarningClosed", {
        get: function () {
            return UserSettings.get(UserSettingKey.MobileWarningClosed) === 'true';
        },
        set: function (newValue) {
            UserSettings.set(UserSettingKey.MobileWarningClosed, String(newValue));
        },
        enumerable: false,
        configurable: true
    });
    return UserSettings;
}());
exports.UserSettings = UserSettings;
function exportUserSettingsBlob() {
    return window.btoa(exportUserSettings());
}
exports.exportUserSettingsBlob = exportUserSettingsBlob;
function exportUserSettings() {
    var keys = Object.values(UserSettingKey);
    var settings = Object.fromEntries(keys.map(function (key) { return [key, localStorage.getItem(key)]; }));
    settings.timestamp = "".concat(Date.now());
    return JSON.stringify(settings);
}
function importUserSettingsBlob(blob) {
    return importUserSettings(window.atob(blob));
}
exports.importUserSettingsBlob = importUserSettingsBlob;
function importUserSettings(json) {
    var settings = parseUserSettings(json);
    if (!settings) {
        return [];
    }
    var timestamp = settings.timestamp;
    var lastTimestamp = localStorage.getItem('timestamp');
    if (!timestamp || (lastTimestamp && Number(timestamp) <= Number(lastTimestamp))) {
        return [];
    }
    var importedKeys = [];
    for (var _i = 0, _a = Object.entries(settings); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (Object.values(UserSettingKey).includes(key)) {
            if (value) {
                localStorage.setItem(key, value);
            }
            else {
                localStorage.removeItem(key);
            }
            importedKeys.push(key);
        }
    }
    return importedKeys;
}
function parseUserSettings(json) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        return undefined;
    }
}
