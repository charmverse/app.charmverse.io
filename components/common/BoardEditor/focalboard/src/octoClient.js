"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.OctoClient = void 0;
var octoUtils_1 = require("./octoUtils");
var utils_1 = require("./utils");
var userSettings_1 = require("./userSettings");
//
// OctoClient is the client interface to the server APIs
//
var OctoClient = /** @class */ (function () {
    function OctoClient(serverUrl, workspaceId) {
        if (workspaceId === void 0) { workspaceId = '0'; }
        this.workspaceId = workspaceId;
        this.logged = false;
        this.serverUrl = serverUrl;
    }
    // this need to be a function rather than a const because
    // one of the global variable (`window.baseURL`) is set at runtime
    // after the first instance of OctoClient is created.
    // Avoiding the race condition becomes more complex than making
    // the base URL dynamic though a function
    OctoClient.prototype.getBaseURL = function () {
        var baseURL = (this.serverUrl || utils_1.Utils.getBaseURL(true)).replace(/\/$/, '');
        // Logging this for debugging.
        // Logging just once to avoid log noise.
        if (!this.logged) {
            utils_1.Utils.log("OctoClient baseURL: ".concat(baseURL));
            this.logged = true;
        }
        return baseURL;
    };
    OctoClient.prototype.getJson = function (response, defaultValue) {
        return __awaiter(this, void 0, void 0, function () {
            var value, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, response.json()];
                    case 1:
                        value = _b.sent();
                        return [2 /*return*/, value || defaultValue];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, defaultValue];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OctoClient.prototype.getClientConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var path, response, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = '/api/focalboard/clientConfig';
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, {
                                method: 'GET',
                                headers: this.headers()
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.getJson(response, {})];
                    case 2:
                        json = (_a.sent());
                        return [2 /*return*/, json];
                }
            });
        });
    };
    OctoClient.prototype.register = function (email, username, password, token) {
        return __awaiter(this, void 0, void 0, function () {
            var path, body, response, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = '/api/focalboard/register';
                        body = JSON.stringify({ email: email, username: username, password: password, token: token });
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, {
                                method: 'POST',
                                headers: this.headers(),
                                body: body
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, this.getJson(response, {})];
                    case 2:
                        json = (_a.sent());
                        return [2 /*return*/, { code: response.status, json: json }];
                }
            });
        });
    };
    OctoClient.prototype.changePassword = function (userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var path, body, response, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/focalboard/users/".concat(encodeURIComponent(userId), "/changepassword");
                        body = JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword });
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, {
                                method: 'POST',
                                headers: this.headers(),
                                body: body
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, this.getJson(response, {})];
                    case 2:
                        json = (_a.sent());
                        return [2 /*return*/, { code: response.status, json: json }];
                }
            });
        });
    };
    OctoClient.prototype.headers = function () {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    };
    /**
       * Generates workspace's path.
       * Uses workspace ID from `workspaceId` param is provided,
       * Else uses Client's workspaceID if available, else the user's last visited workspace ID.
       */
    OctoClient.prototype.workspacePath = function (workspaceId) {
        var workspaceIdToUse = workspaceId;
        if (!workspaceId) {
            workspaceIdToUse = this.workspaceId === '0' ? userSettings_1.UserSettings.lastWorkspaceId || this.workspaceId : this.workspaceId;
        }
        return "/api/focalboard/workspaces/".concat(workspaceIdToUse);
    };
    OctoClient.prototype.getMe = function () {
        return __awaiter(this, void 0, void 0, function () {
            var path, response, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = '/api/focalboard/users/me';
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, this.getJson(response, {})];
                    case 2:
                        user = (_a.sent());
                        return [2 /*return*/, user];
                }
            });
        });
    };
    OctoClient.prototype.getUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var path, response, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/focalboard/users/".concat(encodeURIComponent(userId));
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, this.getJson(response, {})];
                    case 2:
                        user = (_a.sent());
                        return [2 /*return*/, user];
                }
            });
        });
    };
    OctoClient.prototype.getSubtree = function (rootId, levels, workspaceID) {
        if (levels === void 0) { levels = 2; }
        return __awaiter(this, void 0, void 0, function () {
            var path, readToken, response, blocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "".concat(this.workspacePath(workspaceID), "/blocks/").concat(encodeURIComponent(rootId || ''), "/subtree?l=").concat(levels);
                        readToken = utils_1.Utils.getReadToken();
                        if (readToken) {
                            path += "&read_token=".concat(readToken);
                        }
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.getJson(response, [])];
                    case 2:
                        blocks = (_a.sent());
                        return [2 /*return*/, this.fixBlocks(blocks)];
                }
            });
        });
    };
    // If no boardID is provided, it will export the entire archive
    OctoClient.prototype.exportArchive = function (boardID) {
        if (boardID === void 0) { boardID = ''; }
        return __awaiter(this, void 0, void 0, function () {
            var path, response, blocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "".concat(this.workspacePath(), "/blocks/export?root_id=").concat(boardID);
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.getJson(response, [])];
                    case 2:
                        blocks = (_a.sent());
                        return [2 /*return*/, this.fixBlocks(blocks)];
                }
            });
        });
    };
    OctoClient.prototype.importFullArchive = function (blocks) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                utils_1.Utils.log("importFullArchive: ".concat(blocks.length, " blocks(s)"));
                body = JSON.stringify(blocks);
                return [2 /*return*/, fetch("".concat(this.getBaseURL() + this.workspacePath(), "/blocks/import"), {
                        method: 'POST',
                        headers: this.headers(),
                        body: body
                    })];
            });
        });
    };
    OctoClient.prototype.fixBlocks = function (blocks) {
        if (!blocks) {
            return [];
        }
        // Hydrate is important, as it ensures that each block is complete to the current model
        var fixedBlocks = octoUtils_1.OctoUtils.hydrateBlocks(blocks);
        return fixedBlocks;
    };
    OctoClient.prototype.followBlock = function (blockId, blockType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                body = {
                    blockType: blockType,
                    blockId: blockId,
                    workspaceId: this.workspaceId,
                    subscriberType: 'user',
                    subscriberId: userId
                };
                return [2 /*return*/, fetch("".concat(this.getBaseURL(), "/api/focalboard/workspaces/").concat(this.workspaceId, "/subscriptions"), {
                        method: 'POST',
                        headers: this.headers(),
                        body: JSON.stringify(body)
                    })];
            });
        });
    };
    OctoClient.prototype.unfollowBlock = function (blockId, blockType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fetch("".concat(this.getBaseURL(), "/api/focalboard/workspaces/").concat(this.workspaceId, "/subscriptions/").concat(blockId, "/").concat(userId), {
                        method: 'DELETE',
                        headers: this.headers()
                    })];
            });
        });
    };
    // Sharing
    OctoClient.prototype.getSharing = function (rootId) {
        return __awaiter(this, void 0, void 0, function () {
            var path, response, sharing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "".concat(this.workspacePath(), "/sharing/").concat(rootId);
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, this.getJson(response, undefined)];
                    case 2:
                        sharing = (_a.sent());
                        return [2 /*return*/, sharing];
                }
            });
        });
    };
    OctoClient.prototype.setSharing = function (sharing) {
        return __awaiter(this, void 0, void 0, function () {
            var path, body, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "".concat(this.workspacePath(), "/sharing/").concat(sharing.id);
                        body = JSON.stringify(sharing);
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, {
                                method: 'POST',
                                headers: this.headers(),
                                body: body
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Workspace
    OctoClient.prototype.regenerateWorkspaceSignupToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var path, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "".concat(this.workspacePath(), "/regenerate_signup_token");
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, {
                                method: 'POST',
                                headers: this.headers()
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Files
    // Returns fileId of uploaded file, or undefined on failure
    OctoClient.prototype.uploadFile = function (rootID, file) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, headers, response, text, json, e_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formData = new FormData();
                        formData.append('file', file);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        headers = this.headers();
                        // TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
                        delete headers['Content-Type'];
                        return [4 /*yield*/, fetch("".concat(this.getBaseURL() + this.workspacePath(), "/").concat(rootID, "/files"), {
                                method: 'POST',
                                headers: headers,
                                body: formData
                            })];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, undefined];
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, response.text()];
                    case 4:
                        text = _a.sent();
                        utils_1.Utils.log("uploadFile response: ".concat(text));
                        json = JSON.parse(text);
                        return [2 /*return*/, json.fileId];
                    case 5:
                        e_1 = _a.sent();
                        utils_1.Utils.logError("uploadFile json ERROR: ".concat(e_1));
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        utils_1.Utils.logError("uploadFile ERROR: ".concat(e_2));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, undefined];
                }
            });
        });
    };
    OctoClient.prototype.getFileAsDataUrl = function (rootId, fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var path, readToken, response, blob;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/files/workspaces/".concat(this.workspaceId, "/").concat(rootId, "/").concat(fileId);
                        readToken = utils_1.Utils.getReadToken();
                        if (readToken) {
                            path += "?read_token=".concat(readToken);
                        }
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, ''];
                        }
                        return [4 /*yield*/, response.blob()];
                    case 2:
                        blob = _a.sent();
                        return [2 /*return*/, URL.createObjectURL(blob)];
                }
            });
        });
    };
    OctoClient.prototype.getGlobalTemplates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // const path = this.workspacePath('0') + '/blocks?type=board'
                return [2 /*return*/, []];
            });
        });
    };
    OctoClient.prototype.getUserBlockSubscriptions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var path, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = "/api/focalboard/workspaces/".concat(this.workspaceId, "/subscriptions/").concat(userId);
                        return [4 /*yield*/, fetch(this.getBaseURL() + path, { headers: this.headers() })];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.getJson(response, [])];
                    case 2: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    return OctoClient;
}());
exports.OctoClient = OctoClient;
var octoClient = new OctoClient();
exports["default"] = octoClient;
