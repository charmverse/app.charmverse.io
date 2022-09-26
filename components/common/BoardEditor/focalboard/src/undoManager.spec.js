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
var undomanager_1 = require("./undomanager");
test('Basic undo/redo', function () { return __awaiter(void 0, void 0, void 0, function () {
    var values;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(undomanager_1["default"].currentCheckpoint).toBe(0);
                values = [];
                return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.push('a');
                            return [2 /*return*/];
                        });
                    }); }, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.pop();
                            return [2 /*return*/];
                        });
                    }); }, 'test')];
            case 1:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(undomanager_1["default"].currentCheckpoint).toBeGreaterThan(0);
                expect(values).toEqual(['a']);
                expect(undomanager_1["default"].undoDescription).toBe('test');
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [4 /*yield*/, undomanager_1["default"].undo()];
            case 2:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(true);
                expect(values).toEqual([]);
                expect(undomanager_1["default"].undoDescription).toBe(undefined);
                expect(undomanager_1["default"].redoDescription).toBe('test');
                return [4 /*yield*/, undomanager_1["default"].redo()];
            case 3:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(values).toEqual(['a']);
                return [4 /*yield*/, undomanager_1["default"].clear()];
            case 4:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(undomanager_1["default"].currentCheckpoint).toBe(0);
                expect(undomanager_1["default"].undoDescription).toBe(undefined);
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [2 /*return*/];
        }
    });
}); });
test('Basic undo/redo response dependant', function () { return __awaiter(void 0, void 0, void 0, function () {
    var blockIds, blocks, newBlock;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(undomanager_1["default"].currentCheckpoint).toBe(0);
                blockIds = [2, 1];
                blocks = {};
                return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var responseId, block;
                        return __generator(this, function (_a) {
                            responseId = blockIds.pop();
                            block = { id: responseId, title: 'Sample' };
                            blocks[block.id] = block;
                            return [2 /*return*/, block];
                        });
                    }); }, function (block) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            delete blocks[block.id];
                            return [2 /*return*/];
                        });
                    }); }, 'test')];
            case 1:
                newBlock = _a.sent();
                // should insert the block and return the new block for its use
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(blocks).toHaveProperty('1');
                expect(blocks[1]).toEqual(newBlock);
                // should correctly remove the block based on the info gathered in
                // the redo function
                return [4 /*yield*/, undomanager_1["default"].undo()];
            case 2:
                // should correctly remove the block based on the info gathered in
                // the redo function
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(true);
                expect(blocks).not.toHaveProperty('1');
                // when redoing, as the function has side effects the new id will
                // be different
                return [4 /*yield*/, undomanager_1["default"].redo()];
            case 3:
                // when redoing, as the function has side effects the new id will
                // be different
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(blocks).not.toHaveProperty('1');
                expect(blocks).toHaveProperty('2');
                expect(blocks[2].id).toEqual(2);
                // when undoing, the undo manager has saved the new id internally
                // and it removes the right block
                return [4 /*yield*/, undomanager_1["default"].undo()];
            case 4:
                // when undoing, the undo manager has saved the new id internally
                // and it removes the right block
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(true);
                expect(blocks).not.toHaveProperty('2');
                return [4 /*yield*/, undomanager_1["default"].clear()];
            case 5:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('Grouped undo/redo', function () { return __awaiter(void 0, void 0, void 0, function () {
    var values, groupId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(false);
                values = [];
                groupId = 'the group id';
                return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.push('a');
                            return [2 /*return*/];
                        });
                    }); }, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.pop();
                            return [2 /*return*/];
                        });
                    }); }, 'insert a')];
            case 1:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(values).toEqual(['a']);
                expect(undomanager_1["default"].undoDescription).toBe('insert a');
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.push('b');
                            return [2 /*return*/];
                        });
                    }); }, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.pop();
                            return [2 /*return*/];
                        });
                    }); }, 'insert b', groupId)];
            case 2:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(values).toEqual(['a', 'b']);
                expect(undomanager_1["default"].undoDescription).toBe('insert b');
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.push('c');
                            return [2 /*return*/];
                        });
                    }); }, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            values.pop();
                            return [2 /*return*/];
                        });
                    }); }, 'insert c', groupId)];
            case 3:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(values).toEqual(['a', 'b', 'c']);
                expect(undomanager_1["default"].undoDescription).toBe('insert c');
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [4 /*yield*/, undomanager_1["default"].undo()];
            case 4:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(true);
                expect(values).toEqual(['a']);
                expect(undomanager_1["default"].undoDescription).toBe('insert a');
                expect(undomanager_1["default"].redoDescription).toBe('insert b');
                return [4 /*yield*/, undomanager_1["default"].redo()];
            case 5:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(true);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(values).toEqual(['a', 'b', 'c']);
                expect(undomanager_1["default"].undoDescription).toBe('insert c');
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [4 /*yield*/, undomanager_1["default"].clear()];
            case 6:
                _a.sent();
                expect(undomanager_1["default"].canUndo).toBe(false);
                expect(undomanager_1["default"].canRedo).toBe(false);
                expect(undomanager_1["default"].undoDescription).toBe(undefined);
                expect(undomanager_1["default"].redoDescription).toBe(undefined);
                return [2 /*return*/];
        }
    });
}); });
