"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.WSClient = exports.ACTION_UPDATE_SUBSCRIPTION = exports.ACTION_UPDATE_CLIENT_CONFIG = exports.ACTION_UNSUBSCRIBE_BLOCKS = exports.ACTION_UNSUBSCRIBE_WORKSPACE = exports.ACTION_SUBSCRIBE_WORKSPACE = exports.ACTION_SUBSCRIBE_BLOCKS = exports.ACTION_AUTH = exports.ACTION_UPDATE_BLOCK = void 0;
var utils_1 = require("./utils");
var octoUtils_1 = require("./octoUtils");
exports.ACTION_UPDATE_BLOCK = 'UPDATE_BLOCK';
exports.ACTION_AUTH = 'AUTH';
exports.ACTION_SUBSCRIBE_BLOCKS = 'SUBSCRIBE_BLOCKS';
exports.ACTION_SUBSCRIBE_WORKSPACE = 'SUBSCRIBE_WORKSPACE';
exports.ACTION_UNSUBSCRIBE_WORKSPACE = 'UNSUBSCRIBE_WORKSPACE';
exports.ACTION_UNSUBSCRIBE_BLOCKS = 'UNSUBSCRIBE_BLOCKS';
exports.ACTION_UPDATE_CLIENT_CONFIG = 'UPDATE_CLIENT_CONFIG';
exports.ACTION_UPDATE_SUBSCRIPTION = 'UPDATE_SUBSCRIPTION';
var WSClient = /** @class */ (function () {
    function WSClient(serverUrl) {
        this.ws = null;
        this.client = null;
        this.onPluginReconnect = null;
        this.pluginId = '';
        this.pluginVersion = '';
        this.onAppVersionChangeHandler = null;
        this.clientPrefix = '';
        this.state = 'init';
        this.onStateChange = [];
        this.onReconnect = [];
        this.onChange = [];
        this.onError = [];
        this.onConfigChange = [];
        this.onFollowBlock = function () { };
        this.onUnfollowBlock = function () { };
        this.notificationDelay = 100;
        this.reopenDelay = 3000;
        this.updatedBlocks = [];
        this.logged = false;
        this.serverUrl = serverUrl;
    }
    // this need to be a function rather than a const because
    // one of the global variable (`window.baseURL`) is set at runtime
    // after the first instance of OctoClient is created.
    // Avoiding the race condition becomes more complex than making
    // the base URL dynamic though a function
    WSClient.prototype.getBaseURL = function () {
        var baseURL = (this.serverUrl || utils_1.Utils.getBaseURL(true)).replace(/\/$/, '');
        // Logging this for debugging.
        // Logging just once to avoid log noise.
        if (!this.logged) {
            utils_1.Utils.log("WSClient serverUrl: ".concat(baseURL));
            this.logged = true;
        }
        return baseURL;
    };
    WSClient.prototype.initPlugin = function (pluginId, pluginVersion, client) {
        this.pluginId = pluginId;
        this.pluginVersion = pluginVersion;
        this.clientPrefix = "custom_".concat(pluginId, "_");
        this.client = client;
        utils_1.Utils.log("WSClient initialised for plugin id \"".concat(pluginId, "\""));
    };
    WSClient.prototype.sendCommand = function (command) {
        var _a;
        if (this.client !== null) {
            var action = command.action, data = __rest(command, ["action"]);
            this.client.sendMessage(this.clientPrefix + action, data);
            return;
        }
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(command));
    };
    WSClient.prototype.addOnChange = function (handler) {
        this.onChange.push(handler);
    };
    WSClient.prototype.removeOnChange = function (handler) {
        var index = this.onChange.indexOf(handler);
        if (index !== -1) {
            this.onChange.splice(index, 1);
        }
    };
    WSClient.prototype.addOnReconnect = function (handler) {
        this.onReconnect.push(handler);
    };
    WSClient.prototype.removeOnReconnect = function (handler) {
        var index = this.onReconnect.indexOf(handler);
        if (index !== -1) {
            this.onReconnect.splice(index, 1);
        }
    };
    WSClient.prototype.addOnStateChange = function (handler) {
        this.onStateChange.push(handler);
    };
    WSClient.prototype.removeOnStateChange = function (handler) {
        var index = this.onStateChange.indexOf(handler);
        if (index !== -1) {
            this.onStateChange.splice(index, 1);
        }
    };
    WSClient.prototype.addOnError = function (handler) {
        this.onError.push(handler);
    };
    WSClient.prototype.removeOnError = function (handler) {
        var index = this.onError.indexOf(handler);
        if (index !== -1) {
            this.onError.splice(index, 1);
        }
    };
    WSClient.prototype.addOnConfigChange = function (handler) {
        this.onConfigChange.push(handler);
    };
    WSClient.prototype.removeOnConfigChange = function (handler) {
        var index = this.onConfigChange.indexOf(handler);
        if (index !== -1) {
            this.onConfigChange.splice(index, 1);
        }
    };
    WSClient.prototype.open = function () {
        var _this = this;
        if (this.client !== null) {
            // configure the Mattermost websocket client callbacks
            var onConnect_1 = function () {
                utils_1.Utils.log('WSClient in plugin mode, reusing Mattermost WS connection');
                for (var _i = 0, _a = _this.onStateChange; _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(_this, 'open');
                }
                _this.state = 'open';
            };
            var onReconnect_1 = function () {
                utils_1.Utils.logWarn('WSClient reconnected');
                onConnect_1();
                for (var _i = 0, _a = _this.onReconnect; _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(_this);
                }
            };
            this.onPluginReconnect = onReconnect_1;
            var onClose = function (connectFailCount) {
                utils_1.Utils.logError("WSClient has been closed, connect fail count: ".concat(connectFailCount));
                for (var _i = 0, _a = _this.onStateChange; _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(_this, 'close');
                }
                _this.state = 'close';
                // there is no way to react to a reconnection with the
                // reliable websockets schema, so we poll the raw
                // websockets client for its state directly until it
                // reconnects
                if (!_this.errorPollId) {
                    _this.errorPollId = setInterval(function () {
                        var _a, _b, _c, _d;
                        utils_1.Utils.logWarn("Polling websockets connection for state: ".concat((_b = (_a = _this.client) === null || _a === void 0 ? void 0 : _a.conn) === null || _b === void 0 ? void 0 : _b.readyState));
                        if (((_d = (_c = _this.client) === null || _c === void 0 ? void 0 : _c.conn) === null || _d === void 0 ? void 0 : _d.readyState) === 1) {
                            onReconnect_1();
                            clearInterval(_this.errorPollId);
                            _this.errorPollId = undefined;
                        }
                    }, 500);
                }
            };
            var onError = function (event) {
                utils_1.Utils.logError("WSClient websocket onerror. data: ".concat(JSON.stringify(event)));
                for (var _i = 0, _a = _this.onError; _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(_this, event);
                }
            };
            this.client.setFirstConnectCallback(onConnect_1);
            this.client.setErrorCallback(onError);
            this.client.setCloseCallback(onClose);
            this.client.setReconnectCallback(onReconnect_1);
            return;
        }
        var url = new URL(this.getBaseURL());
        var protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:';
        var wsServerUrl = "".concat(protocol, "//").concat(url.host).concat(url.pathname.replace(/\/$/, ''), "/ws");
        utils_1.Utils.log("WSClient open: ".concat(wsServerUrl));
        var ws = new WebSocket(wsServerUrl);
        this.ws = ws;
        ws.onopen = function () {
            utils_1.Utils.log('WSClient webSocket opened.');
            _this.state = 'open';
            for (var _i = 0, _a = _this.onStateChange; _i < _a.length; _i++) {
                var handler = _a[_i];
                handler(_this, 'open');
            }
        };
        ws.onerror = function (e) {
            utils_1.Utils.logError("WSClient websocket onerror. data: ".concat(e));
            for (var _i = 0, _a = _this.onError; _i < _a.length; _i++) {
                var handler = _a[_i];
                handler(_this, e);
            }
        };
        ws.onclose = function (e) {
            utils_1.Utils.log("WSClient websocket onclose, code: ".concat(e.code, ", reason: ").concat(e.reason));
            if (ws === _this.ws) {
                // Unexpected close, re-open
                utils_1.Utils.logError('Unexpected close, re-opening websocket');
                for (var _i = 0, _a = _this.onStateChange; _i < _a.length; _i++) {
                    var handler = _a[_i];
                    handler(_this, 'close');
                }
                _this.state = 'close';
                setTimeout(function () {
                    _this.open();
                    for (var _i = 0, _a = _this.onReconnect; _i < _a.length; _i++) {
                        var handler = _a[_i];
                        handler(_this);
                    }
                }, _this.reopenDelay);
            }
        };
        ws.onmessage = function (e) {
            if (ws !== _this.ws) {
                utils_1.Utils.log('Ignoring closed ws');
                return;
            }
            try {
                var message = JSON.parse(e.data);
                if (message.error) {
                    utils_1.Utils.logError("Listener websocket error: ".concat(message.error));
                    return;
                }
                switch (message.action) {
                    case exports.ACTION_UPDATE_BLOCK:
                        _this.updateBlockHandler(message);
                        break;
                    default:
                        utils_1.Utils.logError("Unexpected action: ".concat(message.action));
                }
            }
            catch (err) {
                utils_1.Utils.log('message is not an object');
            }
        };
    };
    WSClient.prototype.hasConn = function () {
        return this.ws !== null || this.client !== null;
    };
    WSClient.prototype.updateBlockHandler = function (message) {
        this.queueUpdateNotification(utils_1.Utils.fixBlock(message.block));
    };
    WSClient.prototype.setOnFollowBlock = function (handler) {
        this.onFollowBlock = handler;
    };
    WSClient.prototype.setOnUnfollowBlock = function (handler) {
        this.onUnfollowBlock = handler;
    };
    WSClient.prototype.updateClientConfigHandler = function (config) {
        for (var _i = 0, _a = this.onConfigChange; _i < _a.length; _i++) {
            var handler = _a[_i];
            handler(this, config);
        }
    };
    WSClient.prototype.updateSubscriptionHandler = function (message) {
        var _a;
        utils_1.Utils.log("updateSubscriptionHandler: ".concat(message.action, "; blockId=").concat((_a = message.subscription) === null || _a === void 0 ? void 0 : _a.blockId));
        if (!message.subscription) {
            return;
        }
        var handler = message.subscription.deletedAt ? this.onUnfollowBlock : this.onFollowBlock;
        handler(this, message.subscription);
    };
    WSClient.prototype.setOnAppVersionChangeHandler = function (fn) {
        this.onAppVersionChangeHandler = fn;
    };
    WSClient.prototype.pluginStatusesChangedHandler = function (data) {
        var _this = this;
        if (this.pluginId === '' || !this.onAppVersionChangeHandler) {
            return;
        }
        var focalboardStatusChange = data.plugin_statuses.find(function (s) { return s.plugin_id === _this.pluginId; });
        if (focalboardStatusChange) {
            // if the plugin version is greater than the current one,
            // show the new version banner
            if (utils_1.Utils.compareVersions(this.pluginVersion, focalboardStatusChange.version) > 0) {
                utils_1.Utils.log('Boards plugin has been updated');
                this.onAppVersionChangeHandler(true);
            }
            // if the plugin version is greater or equal, trigger a
            // reconnect to resubscribe in case the interface hasn't
            // been reloaded
            if (utils_1.Utils.compareVersions(this.pluginVersion, focalboardStatusChange.version) >= 0) {
                // this is a temporal solution that leaves a second
                // between the message and the reconnect so the server
                // has time to register the WS handler
                setTimeout(function () {
                    if (_this.onPluginReconnect) {
                        utils_1.Utils.log('Reconnecting after plugin update');
                        _this.onPluginReconnect();
                    }
                }, 1000);
            }
        }
    };
    WSClient.prototype.authenticate = function (workspaceId, token) {
        if (!this.hasConn()) {
            utils_1.Utils.assertFailure('WSClient.addBlocks: ws is not open');
            return;
        }
        if (!token) {
            return;
        }
        var command = {
            action: exports.ACTION_AUTH,
            token: token,
            workspaceId: workspaceId
        };
        this.sendCommand(command);
    };
    WSClient.prototype.subscribeToBlocks = function (workspaceId, blockIds, readToken) {
        if (readToken === void 0) { readToken = ''; }
        if (!this.hasConn()) {
            utils_1.Utils.assertFailure('WSClient.subscribeToBlocks: ws is not open');
            return;
        }
        var command = {
            action: exports.ACTION_SUBSCRIBE_BLOCKS,
            blockIds: blockIds,
            workspaceId: workspaceId,
            readToken: readToken
        };
        this.sendCommand(command);
    };
    WSClient.prototype.unsubscribeToWorkspace = function (workspaceId) {
        if (!this.hasConn()) {
            utils_1.Utils.assertFailure('WSClient.subscribeToWorkspace: ws is not open');
            return;
        }
        var command = {
            action: exports.ACTION_UNSUBSCRIBE_WORKSPACE,
            workspaceId: workspaceId
        };
        this.sendCommand(command);
    };
    WSClient.prototype.subscribeToWorkspace = function (workspaceId) {
        if (!this.hasConn()) {
            utils_1.Utils.assertFailure('WSClient.subscribeToWorkspace: ws is not open');
            return;
        }
        var command = {
            action: exports.ACTION_SUBSCRIBE_WORKSPACE,
            workspaceId: workspaceId
        };
        this.sendCommand(command);
    };
    WSClient.prototype.unsubscribeFromBlocks = function (workspaceId, blockIds, readToken) {
        if (readToken === void 0) { readToken = ''; }
        if (!this.hasConn()) {
            utils_1.Utils.assertFailure('WSClient.removeBlocks: ws is not open');
            return;
        }
        var command = {
            action: exports.ACTION_UNSUBSCRIBE_BLOCKS,
            blockIds: blockIds,
            workspaceId: workspaceId,
            readToken: readToken
        };
        this.sendCommand(command);
    };
    WSClient.prototype.queueUpdateNotification = function (block) {
        var _this = this;
        this.updatedBlocks = this.updatedBlocks.filter(function (o) { return o.id !== block.id; }); // Remove existing queued update
        this.updatedBlocks.push(octoUtils_1.OctoUtils.hydrateBlock(block));
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }
        this.updateTimeout = setTimeout(function () {
            _this.flushUpdateNotifications();
        }, this.notificationDelay);
    };
    WSClient.prototype.flushUpdateNotifications = function () {
        for (var _i = 0, _a = this.updatedBlocks; _i < _a.length; _i++) {
            var block = _a[_i];
            utils_1.Utils.log("WSClient flush update block: ".concat(block.id));
        }
        for (var _b = 0, _c = this.onChange; _b < _c.length; _b++) {
            var handler = _c[_b];
            handler(this, this.updatedBlocks);
        }
        this.updatedBlocks = [];
    };
    WSClient.prototype.close = function () {
        var _a, _b;
        if (!this.hasConn()) {
            return;
        }
        utils_1.Utils.log("WSClient close: ".concat((_a = this.ws) === null || _a === void 0 ? void 0 : _a.url));
        // Use this sequence so the onclose method doesn't try to re-open
        var ws = this.ws;
        this.ws = null;
        this.onChange = [];
        this.onReconnect = [];
        this.onStateChange = [];
        this.onError = [];
        // if running in plugin mode, nothing else needs to be done
        if (this.client) {
            return;
        }
        try {
            ws === null || ws === void 0 ? void 0 : ws.close();
        }
        catch (_c) {
            try {
                (_b = ws === null || ws === void 0 ? void 0 : ws.websocket) === null || _b === void 0 ? void 0 : _b.close();
            }
            catch (_d) {
                utils_1.Utils.log('WSClient unable to close the websocket');
            }
        }
    };
    return WSClient;
}());
exports.WSClient = WSClient;
var wsClient = new WSClient();
exports["default"] = wsClient;
