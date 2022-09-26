"use strict";
exports.__esModule = true;
exports.notifySettingsChanged = exports.importNativeAppSettings = void 0;
var userSettings_1 = require("./userSettings");
function importNativeAppSettings() {
    if (typeof NativeApp === 'undefined' || !NativeApp.settingsBlob) {
        return;
    }
    var importedKeys = (0, userSettings_1.importUserSettingsBlob)(NativeApp.settingsBlob);
    var messageType = importedKeys.length ? 'didImportUserSettings' : 'didNotImportUserSettings';
    postWebKitMessage({ type: messageType, settingsBlob: (0, userSettings_1.exportUserSettingsBlob)(), keys: importedKeys });
    NativeApp.settingsBlob = null;
}
exports.importNativeAppSettings = importNativeAppSettings;
function notifySettingsChanged(key) {
    postWebKitMessage({ type: 'didChangeUserSettings', settingsBlob: (0, userSettings_1.exportUserSettingsBlob)(), key: key });
}
exports.notifySettingsChanged = notifySettingsChanged;
function postWebKitMessage(message) {
    var _a, _b;
    (_b = (_a = window.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers.nativeApp) === null || _b === void 0 ? void 0 : _b.postMessage(message);
}
