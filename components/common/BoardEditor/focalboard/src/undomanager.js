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
//
// General-purpose undo manager
//
var UndoManager = /** @class */ (function () {
    function UndoManager() {
        this.commands = [];
        this.index = -1;
        this.limit = 0;
        this.isExecuting = false;
    }
    Object.defineProperty(UndoManager.prototype, "currentCheckpoint", {
        get: function () {
            if (this.index < 0) {
                return 0;
            }
            return this.commands[this.index].checkpoint;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UndoManager.prototype, "undoDescription", {
        get: function () {
            var command = this.commands[this.index];
            if (!command) {
                return undefined;
            }
            return command.description;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UndoManager.prototype, "redoDescription", {
        get: function () {
            var command = this.commands[this.index + 1];
            if (!command) {
                return undefined;
            }
            return command.description;
        },
        enumerable: false,
        configurable: true
    });
    UndoManager.prototype.execute = function (command, action) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!command || typeof command[action] !== 'function') {
                            return [2 /*return*/, this];
                        }
                        this.isExecuting = true;
                        if (!(action === 'redo')) return [3 /*break*/, 2];
                        _a = command;
                        return [4 /*yield*/, command[action]()];
                    case 1:
                        _a.value = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, command[action](command.value)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        this.isExecuting = false;
                        return [2 /*return*/, this];
                }
            });
        });
    };
    UndoManager.prototype.perform = function (redo, undo, description, groupId, isDiscardable) {
        if (isDiscardable === void 0) { isDiscardable = false; }
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redo()];
                    case 1:
                        value = _a.sent();
                        this.registerUndo({ undo: undo, redo: redo }, description, groupId, value, isDiscardable);
                        return [2 /*return*/, value];
                }
            });
        });
    };
    UndoManager.prototype.registerUndo = function (command, description, groupId, value, isDiscardable) {
        if (isDiscardable === void 0) { isDiscardable = false; }
        if (this.isExecuting) {
            return this;
        }
        // If we are here after having called undo, invalidate items higher on the stack
        this.commands.splice(this.index + 1, this.commands.length - this.index);
        var checkpoint;
        if (isDiscardable) {
            checkpoint = this.commands.length > 1 ? this.commands[this.commands.length - 1].checkpoint : 0;
        }
        else {
            checkpoint = Date.now();
        }
        var internalCommand = {
            checkpoint: checkpoint,
            undo: command.undo,
            redo: command.redo,
            description: description,
            groupId: groupId,
            value: value
        };
        this.commands.push(internalCommand);
        // If limit is set, remove items from the start
        if (this.limit && this.commands.length > this.limit) {
            this.commands = this.commands.splice(0, this.commands.length - this.limit);
        }
        // Set the current index to the end
        this.index = this.commands.length - 1;
        if (this.onStateDidChange) {
            this.onStateDidChange();
        }
        return this;
    };
    UndoManager.prototype.undo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var command, currentGroupId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isExecuting) {
                            return [2 /*return*/, this];
                        }
                        command = this.commands[this.index];
                        if (!command) {
                            return [2 /*return*/, this];
                        }
                        currentGroupId = command.groupId;
                        if (!currentGroupId) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this.execute(command, 'undo')];
                    case 2:
                        _a.sent();
                        this.index -= 1;
                        command = this.commands[this.index];
                        _a.label = 3;
                    case 3:
                        if (this.index >= 0 && currentGroupId === command.groupId) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.execute(command, 'undo')];
                    case 6:
                        _a.sent();
                        this.index -= 1;
                        _a.label = 7;
                    case 7:
                        if (this.onStateDidChange) {
                            this.onStateDidChange();
                        }
                        return [2 /*return*/, this];
                }
            });
        });
    };
    UndoManager.prototype.redo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var command, currentGroupId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isExecuting) {
                            return [2 /*return*/, this];
                        }
                        command = this.commands[this.index + 1];
                        if (!command) {
                            return [2 /*return*/, this];
                        }
                        currentGroupId = command.groupId;
                        if (!currentGroupId) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this.execute(command, 'redo')];
                    case 2:
                        _a.sent();
                        this.index += 1;
                        command = this.commands[this.index + 1];
                        _a.label = 3;
                    case 3:
                        if (this.index < this.commands.length - 1 && currentGroupId === command.groupId) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.execute(command, 'redo')];
                    case 6:
                        _a.sent();
                        this.index += 1;
                        _a.label = 7;
                    case 7:
                        if (this.onStateDidChange) {
                            this.onStateDidChange();
                        }
                        return [2 /*return*/, this];
                }
            });
        });
    };
    UndoManager.prototype.clear = function () {
        var prevSize = this.commands.length;
        this.commands = [];
        this.index = -1;
        if (this.onStateDidChange && prevSize > 0) {
            this.onStateDidChange();
        }
    };
    Object.defineProperty(UndoManager.prototype, "canUndo", {
        get: function () {
            return this.index !== -1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UndoManager.prototype, "canRedo", {
        get: function () {
            return this.index < this.commands.length - 1;
        },
        enumerable: false,
        configurable: true
    });
    return UndoManager;
}());
var undoManager = new UndoManager();
exports["default"] = undoManager;
