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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.mutator = void 0;
var charmClient_1 = require("charmClient");
var publisher_1 = require("../../publisher");
var block_1 = require("./blocks/block");
var board_1 = require("./blocks/board");
var boardView_1 = require("./blocks/boardView");
var card_1 = require("./blocks/card");
var octoClient_1 = require("./octoClient");
var octoUtils_1 = require("./octoUtils");
var undomanager_1 = require("./undomanager");
var utils_1 = require("./utils");
//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
var Mutator = /** @class */ (function () {
    function Mutator() {
    }
    Mutator.prototype.beginUndoGroup = function () {
        if (this.undoGroupId) {
            utils_1.Utils.assertFailure('UndoManager does not support nested groups');
            return undefined;
        }
        this.undoGroupId = utils_1.Utils.createGuid(utils_1.IDType.None);
        return this.undoGroupId;
    };
    Mutator.prototype.endUndoGroup = function (groupId) {
        if (this.undoGroupId !== groupId) {
            utils_1.Utils.assertFailure('Mismatched groupId. UndoManager does not support nested groups');
            return;
        }
        this.undoGroupId = undefined;
    };
    Mutator.prototype.performAsUndoGroup = function (actions) {
        return __awaiter(this, void 0, void 0, function () {
            var groupId, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        groupId = this.beginUndoGroup();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, actions()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        utils_1.Utils.assertFailure("ERROR: ".concat(err_1));
                        return [3 /*break*/, 4];
                    case 4:
                        if (groupId) {
                            this.endUndoGroup(groupId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.updateBlock = function (newBlock, oldBlock, description) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, updatePatch, undoPatch;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, block_1.createPatchesFromBlocks)(newBlock, oldBlock), updatePatch = _a[0], undoPatch = _a[1];
                        return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(newBlock.id, updatePatch, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(oldBlock.id, undoPatch, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, description, this.undoGroupId)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.updateBlocks = function (newBlocks, oldBlocks, description) {
        return __awaiter(this, void 0, void 0, function () {
            var updatePatches, undoPatches;
            var _this = this;
            return __generator(this, function (_a) {
                if (newBlocks.length !== oldBlocks.length) {
                    throw new Error('new and old blocks must have the same length when updating blocks');
                }
                updatePatches = [];
                undoPatches = [];
                newBlocks.forEach(function (newBlock, i) {
                    var _a = (0, block_1.createPatchesFromBlocks)(newBlock, oldBlocks[i]), updatePatch = _a[0], undoPatch = _a[1];
                    updatePatches.push(updatePatch);
                    undoPatches.push(undoPatch);
                });
                return [2 /*return*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, charmClient_1["default"].patchBlocks(newBlocks, updatePatches, publisher_1.publishIncrementalUpdate)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, charmClient_1["default"].patchBlocks(newBlocks, undoPatches, publisher_1.publishIncrementalUpdate)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, description, this.undoGroupId)];
            });
        });
    };
    // eslint-disable-next-line no-shadow
    Mutator.prototype.insertBlock = function (block, description, afterRedo, beforeUndo) {
        if (description === void 0) { description = 'add'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                        var jsonres, newBlock;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, charmClient_1["default"].insertBlock(block, publisher_1.publishIncrementalUpdate)];
                                case 1:
                                    jsonres = _a.sent();
                                    newBlock = jsonres[0];
                                    return [4 /*yield*/, (afterRedo === null || afterRedo === void 0 ? void 0 : afterRedo(newBlock))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, newBlock];
                            }
                        });
                    }); }, function (newBlock) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (beforeUndo === null || beforeUndo === void 0 ? void 0 : beforeUndo(newBlock))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, charmClient_1["default"].deleteBlock(newBlock.id, publisher_1.publishIncrementalUpdate)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, description, this.undoGroupId)];
            });
        });
    };
    // eslint-disable-next-line no-shadow
    Mutator.prototype.insertBlocks = function (blocks, description, afterRedo, beforeUndo) {
        if (description === void 0) { description = 'add'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                        var newBlocks;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, charmClient_1["default"].insertBlocks(blocks, publisher_1.publishIncrementalUpdate)];
                                case 1:
                                    newBlocks = _a.sent();
                                    return [4 /*yield*/, (afterRedo === null || afterRedo === void 0 ? void 0 : afterRedo(newBlocks))];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, newBlocks];
                            }
                        });
                    }); }, function (newBlocks) { return __awaiter(_this, void 0, void 0, function () {
                        var awaits, _i, newBlocks_1, block;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (beforeUndo === null || beforeUndo === void 0 ? void 0 : beforeUndo())];
                                case 1:
                                    _a.sent();
                                    awaits = [];
                                    for (_i = 0, newBlocks_1 = newBlocks; _i < newBlocks_1.length; _i++) {
                                        block = newBlocks_1[_i];
                                        awaits.push(charmClient_1["default"].deleteBlock(block.id, publisher_1.publishIncrementalUpdate));
                                    }
                                    return [4 /*yield*/, Promise.all(awaits)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, description, this.undoGroupId)];
            });
        });
    };
    Mutator.prototype.deleteBlock = function (block, description, beforeRedo, afterUndo) {
        return __awaiter(this, void 0, void 0, function () {
            var actualDescription;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actualDescription = description || "delete ".concat(block.type);
                        return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, (beforeRedo === null || beforeRedo === void 0 ? void 0 : beforeRedo())];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, charmClient_1["default"].deleteBlock(block.id, publisher_1.publishIncrementalUpdate)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // await charmClient.insertBlock(block, publishIncrementalUpdate)
                                        return [4 /*yield*/, (afterUndo === null || afterUndo === void 0 ? void 0 : afterUndo())];
                                        case 1:
                                            // await charmClient.insertBlock(block, publishIncrementalUpdate)
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, actualDescription, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeTitle = function (blockId, oldTitle, newTitle, description) {
        if (description === void 0) { description = 'change title'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { title: newTitle }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { title: oldTitle }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.setDefaultTemplate = function (blockId, oldTemplateId, templateId, description) {
        if (description === void 0) { description = 'set default template'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { defaultTemplateId: templateId } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { defaultTemplateId: oldTemplateId } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.clearDefaultTemplate = function (blockId, oldTemplateId, description) {
        if (description === void 0) { description = 'set default template'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { defaultTemplateId: '' } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { defaultTemplateId: oldTemplateId } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeIcon = function (blockId, oldIcon, icon, description) {
        if (description === void 0) { description = 'change icon'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { icon: icon } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { icon: oldIcon } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeHeaderImage = function (blockId, oldHeaderImage, headerImage, description) {
        if (description === void 0) { description = 'change cover'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { headerImage: headerImage } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { icon: oldHeaderImage } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeDescription = function (blockId, oldBlockDescription, blockDescription, description) {
        if (description === void 0) { description = 'change description'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { description: blockDescription } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(blockId, { updatedFields: { description: oldBlockDescription } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.showDescription = function (boardId, oldShowDescription, showDescription, description) {
        if (showDescription === void 0) { showDescription = true; }
        return __awaiter(this, void 0, void 0, function () {
            var actionDescription;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        actionDescription = description;
                        if (!actionDescription) {
                            actionDescription = showDescription ? 'show description' : 'hide description';
                        }
                        return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(boardId, { updatedFields: { showDescription: showDescription } }, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(boardId, { updatedFields: { showDescription: oldShowDescription } }, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, actionDescription, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeCardContentOrder = function (cardId, oldContentOrder, contentOrder, description) {
        if (description === void 0) { description = 'reorder'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(cardId, { updatedFields: { contentOrder: contentOrder } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(cardId, { updatedFields: { contentOrder: oldContentOrder } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Property Templates
    Mutator.prototype.insertPropertyTemplate = function (board, activeView, index, template) {
        if (index === void 0) { index = -1; }
        return __awaiter(this, void 0, void 0, function () {
            var newTemplate, oldBlocks, newBoard, changedBlocks, description, newActiveView, viewIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeView) {
                            utils_1.Utils.assertFailure('insertPropertyTemplate: no activeView');
                            return [2 /*return*/, ''];
                        }
                        newTemplate = template || {
                            id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
                            name: 'New Property',
                            type: 'text',
                            options: []
                        };
                        oldBlocks = [board];
                        newBoard = (0, board_1.createBoard)({ block: board });
                        // insert at end of board.fields.cardProperties
                        newBoard.fields.cardProperties.push(newTemplate);
                        changedBlocks = [newBoard];
                        description = 'add property';
                        if (activeView.fields.viewType === 'table') {
                            oldBlocks.push(activeView);
                            newActiveView = (0, boardView_1.createBoardView)(activeView);
                            viewIndex = index > 0 ? index : activeView.fields.visiblePropertyIds.length;
                            newActiveView.fields.visiblePropertyIds.splice(viewIndex, 0, newTemplate.id);
                            changedBlocks.push(newActiveView);
                            description = 'add column';
                        }
                        return [4 /*yield*/, this.updateBlocks(changedBlocks, oldBlocks, description)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, newTemplate.id];
                }
            });
        });
    };
    Mutator.prototype.duplicatePropertyTemplate = function (board, activeView, propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var oldBlocks, newBoard, changedBlocks, index, srcTemplate, newTemplate, description, newActiveView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeView) {
                            utils_1.Utils.assertFailure('duplicatePropertyTemplate: no activeView');
                            return [2 /*return*/];
                        }
                        oldBlocks = [board];
                        newBoard = (0, board_1.createBoard)({ block: board });
                        changedBlocks = [newBoard];
                        index = newBoard.fields.cardProperties.findIndex(function (o) { return o.id === propertyId; });
                        if (index === -1) {
                            utils_1.Utils.assertFailure("Cannot find template with id: ".concat(propertyId));
                            return [2 /*return*/];
                        }
                        srcTemplate = newBoard.fields.cardProperties[index];
                        newTemplate = {
                            id: utils_1.Utils.createGuid(utils_1.IDType.BlockID),
                            name: "".concat(srcTemplate.name, " copy"),
                            type: srcTemplate.type,
                            options: srcTemplate.options.slice()
                        };
                        newBoard.fields.cardProperties.splice(index + 1, 0, newTemplate);
                        description = 'duplicate property';
                        if (activeView.fields.viewType === 'table') {
                            oldBlocks.push(activeView);
                            newActiveView = (0, boardView_1.createBoardView)(activeView);
                            newActiveView.fields.visiblePropertyIds.push(newTemplate.id);
                            changedBlocks.push(newActiveView);
                            description = 'duplicate column';
                        }
                        return [4 /*yield*/, this.updateBlocks(changedBlocks, oldBlocks, description)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changePropertyTemplateOrder = function (board, template, destIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var templates, newValue, srcIndex, newBoard;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        templates = board.fields.cardProperties;
                        newValue = templates.slice();
                        srcIndex = templates.indexOf(template);
                        utils_1.Utils.log("srcIndex: ".concat(srcIndex, ", destIndex: ").concat(destIndex));
                        newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0]);
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newBoard.fields.cardProperties = newValue;
                        return [4 /*yield*/, this.updateBlock(newBoard, board, 'reorder properties')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.deleteProperty = function (board, views, cards, propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var oldBlocks, newBoard, changedBlocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldBlocks = [board];
                        newBoard = (0, board_1.createBoard)({ block: board });
                        changedBlocks = [newBoard];
                        newBoard.fields.cardProperties = board.fields.cardProperties.filter(function (o) { return o.id !== propertyId; });
                        views.forEach(function (view) {
                            if (view.fields.visiblePropertyIds.includes(propertyId)) {
                                oldBlocks.push(view);
                                var newView = (0, boardView_1.createBoardView)(view);
                                newView.fields.visiblePropertyIds = view.fields.visiblePropertyIds.filter(function (o) { return o !== propertyId; });
                                changedBlocks.push(newView);
                            }
                        });
                        cards.forEach(function (card) {
                            if (card.fields.properties[propertyId]) {
                                oldBlocks.push(card);
                                var newCard = (0, card_1.createCard)(card);
                                delete newCard.fields.properties[propertyId];
                                changedBlocks.push(newCard);
                            }
                        });
                        return [4 /*yield*/, this.updateBlocks(changedBlocks, oldBlocks, 'delete property')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Properties
    Mutator.prototype.insertPropertyOption = function (board, template, option, description) {
        if (description === void 0) { description = 'add option'; }
        return __awaiter(this, void 0, void 0, function () {
            var newBoard, newTemplate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utils_1.Utils.assert(board.fields.cardProperties.includes(template));
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === template.id; });
                        newTemplate.options.push(option);
                        return [4 /*yield*/, this.updateBlock(newBoard, board, description)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.deletePropertyOption = function (board, template, option) {
        return __awaiter(this, void 0, void 0, function () {
            var newBoard, newTemplate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === template.id; });
                        newTemplate.options = newTemplate.options.filter(function (o) { return o.id !== option.id; });
                        return [4 /*yield*/, this.updateBlock(newBoard, board, 'delete option')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changePropertyOptionOrder = function (board, template, option, destIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var srcIndex, newBoard, newTemplate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        srcIndex = template.options.indexOf(option);
                        utils_1.Utils.log("srcIndex: ".concat(srcIndex, ", destIndex: ").concat(destIndex));
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === template.id; });
                        newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0]);
                        return [4 /*yield*/, this.updateBlock(newBoard, board, 'reorder options')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changePropertyOptionValue = function (board, propertyTemplate, option, value) {
        return __awaiter(this, void 0, void 0, function () {
            var oldBlocks, newBoard, newTemplate, newOption, changedBlocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldBlocks = [board];
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === propertyTemplate.id; });
                        newOption = newTemplate.options.find(function (o) { return o.id === option.id; });
                        newOption.value = value;
                        changedBlocks = [newBoard];
                        return [4 /*yield*/, this.updateBlocks(changedBlocks, oldBlocks, 'rename option')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, changedBlocks];
                }
            });
        });
    };
    Mutator.prototype.changePropertyOptionColor = function (board, template, option, color) {
        return __awaiter(this, void 0, void 0, function () {
            var newBoard, newTemplate, newOption;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === template.id; });
                        newOption = newTemplate.options.find(function (o) { return o.id === option.id; });
                        newOption.color = color;
                        return [4 /*yield*/, this.updateBlock(newBoard, board, 'change option color')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changePropertyValue = function (card, propertyId, value, description, mutate) {
        if (description === void 0) { description = 'change property'; }
        if (mutate === void 0) { mutate = true; }
        var oldValue = card.fields.properties[propertyId];
        // dont save anything if property value was not changed.
        if (oldValue === value) {
            return;
        }
        var newCard = (0, card_1.createCard)(card);
        if (value) {
            newCard.fields.properties[propertyId] = value;
        }
        else {
            delete newCard.fields.properties[propertyId];
        }
        if (mutate) {
            // TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.EditCardProperty, {board: card.rootId, card: card.id})
            return this.updateBlock(newCard, card, description);
        }
        else {
            return { newBlock: newCard, block: card };
        }
    };
    Mutator.prototype.changePropertyTypeAndName = function (board, cards, propertyTemplate, newType, newName) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var newBoard, newTemplate, oldBlocks, newBlocks, isNewTypeSelectOrMulti, _loop_1, _i, cards_1, card, _loop_2, _c, cards_2, card;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (propertyTemplate.type === newType && propertyTemplate.name === newName) {
                            return [2 /*return*/];
                        }
                        newBoard = (0, board_1.createBoard)({ block: board });
                        newTemplate = newBoard.fields.cardProperties.find(function (o) { return o.id === propertyTemplate.id; });
                        if (propertyTemplate.type !== newType) {
                            newTemplate.options = [];
                        }
                        newTemplate.type = newType;
                        newTemplate.name = newName;
                        oldBlocks = [board];
                        newBlocks = [newBoard];
                        if (propertyTemplate.type !== newType) {
                            if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') { // If the old type was either select or multiselect
                                isNewTypeSelectOrMulti = newType === 'select' || newType === 'multiSelect';
                                _loop_1 = function (card) {
                                    var oldValue = Array.isArray(card.fields.properties[propertyTemplate.id]) ? (card.fields.properties[propertyTemplate.id].length > 0 && card.fields.properties[propertyTemplate.id][0]) : card.fields.properties[propertyTemplate.id];
                                    if (oldValue) {
                                        var newValue = isNewTypeSelectOrMulti ? (_a = propertyTemplate.options.find(function (o) { return o.id === oldValue; })) === null || _a === void 0 ? void 0 : _a.id : (_b = propertyTemplate.options.find(function (o) { return o.id === oldValue; })) === null || _b === void 0 ? void 0 : _b.value;
                                        var newCard = (0, card_1.createCard)(card);
                                        if (newValue) {
                                            newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [newValue] : newValue;
                                        }
                                        else {
                                            // This was an invalid select option, so delete it
                                            delete newCard.fields.properties[propertyTemplate.id];
                                        }
                                        newBlocks.push(newCard);
                                        oldBlocks.push(card);
                                    }
                                    if (isNewTypeSelectOrMulti) {
                                        newTemplate.options = propertyTemplate.options;
                                    }
                                };
                                for (_i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
                                    card = cards_1[_i];
                                    _loop_1(card);
                                }
                            }
                            else if (newType === 'select' || newType === 'multiSelect') { // if the new type is either select or multiselect
                                _loop_2 = function (card) {
                                    var oldValue = card.fields.properties[propertyTemplate.id];
                                    if (oldValue) {
                                        var option = newTemplate.options.find(function (o) { return o.value === oldValue; });
                                        if (!option) {
                                            option = {
                                                id: utils_1.Utils.createGuid(utils_1.IDType.None),
                                                value: oldValue,
                                                color: 'propColorDefault'
                                            };
                                            newTemplate.options.push(option);
                                        }
                                        var newCard = (0, card_1.createCard)(card);
                                        newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [option.id] : option.id;
                                        newBlocks.push(newCard);
                                        oldBlocks.push(card);
                                    }
                                };
                                // Map values to new template option IDs
                                for (_c = 0, cards_2 = cards; _c < cards_2.length; _c++) {
                                    card = cards_2[_c];
                                    _loop_2(card);
                                }
                            }
                        }
                        return [4 /*yield*/, this.updateBlocks(newBlocks, oldBlocks, 'change property type and name')];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Views
    Mutator.prototype.changeViewSortOptions = function (viewId, oldSortOptions, sortOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { sortOptions: sortOptions } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { sortOptions: oldSortOptions } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'sort', this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewFilter = function (viewId, oldFilter, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { filter: filter } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { filter: oldFilter } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'filter', this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewGroupById = function (viewId, oldGroupById, groupById) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { groupById: groupById } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { groupById: oldGroupById } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'group by', this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewDateDisplayPropertyId = function (viewId, oldDateDisplayPropertyId, dateDisplayPropertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { dateDisplayPropertyId: dateDisplayPropertyId } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { dateDisplayPropertyId: oldDateDisplayPropertyId } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'display by', this.undoDisplayId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewVisiblePropertiesOrder = function (view, template, destIndex, description) {
        if (description === void 0) { description = 'change property order'; }
        return __awaiter(this, void 0, void 0, function () {
            var oldVisiblePropertyIds, newOrder, srcIndex;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldVisiblePropertyIds = view.fields.visiblePropertyIds;
                        newOrder = oldVisiblePropertyIds.slice();
                        srcIndex = oldVisiblePropertyIds.indexOf(template.id);
                        utils_1.Utils.log("srcIndex: ".concat(srcIndex, ", destIndex: ").concat(destIndex));
                        newOrder.splice(destIndex, 0, newOrder.splice(srcIndex, 1)[0]);
                        return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(view.id, { updatedFields: { visiblePropertyIds: newOrder } }, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(view.id, { updatedFields: { visiblePropertyIds: oldVisiblePropertyIds } }, publisher_1.publishIncrementalUpdate)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewVisibleProperties = function (viewId, oldVisiblePropertyIds, visiblePropertyIds, description) {
        if (description === void 0) { description = 'show / hide property'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { visiblePropertyIds: visiblePropertyIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { visiblePropertyIds: oldVisiblePropertyIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewVisibleOptionIds = function (viewId, oldVisibleOptionIds, visibleOptionIds, description) {
        if (description === void 0) { description = 'reorder'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { visibleOptionIds: visibleOptionIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { visibleOptionIds: oldVisibleOptionIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewHiddenOptionIds = function (viewId, oldHiddenOptionIds, hiddenOptionIds, description) {
        if (description === void 0) { description = 'reorder'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { hiddenOptionIds: hiddenOptionIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { hiddenOptionIds: oldHiddenOptionIds } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewKanbanCalculations = function (viewId, oldCalculations, calculations, description) {
        if (description === void 0) { description = 'updated kanban calculations'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { kanbanCalculations: calculations } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, charmClient_1["default"].patchBlock(viewId, { updatedFields: { kanbanCalculations: oldCalculations } }, publisher_1.publishIncrementalUpdate)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, description, this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.hideViewColumn = function (view, columnOptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var newView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (view.fields.hiddenOptionIds.includes(columnOptionId)) {
                            return [2 /*return*/];
                        }
                        newView = (0, boardView_1.createBoardView)(view);
                        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter(function (o) { return o !== columnOptionId; });
                        newView.fields.hiddenOptionIds = __spreadArray(__spreadArray([], newView.fields.hiddenOptionIds, true), [columnOptionId], false);
                        return [4 /*yield*/, this.updateBlock(newView, view, 'hide column')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.unhideViewColumn = function (view, columnOptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var newView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!view.fields.hiddenOptionIds.includes(columnOptionId)) {
                            return [2 /*return*/];
                        }
                        newView = (0, boardView_1.createBoardView)(view);
                        newView.fields.hiddenOptionIds = newView.fields.hiddenOptionIds.filter(function (o) { return o !== columnOptionId; });
                        // Put the column at the end of the visible list
                        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter(function (o) { return o !== columnOptionId; });
                        newView.fields.visibleOptionIds = __spreadArray(__spreadArray([], newView.fields.visibleOptionIds, true), [columnOptionId], false);
                        return [4 /*yield*/, this.updateBlock(newView, view, 'show column')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.changeViewCardOrder = function (view, cardOrder, description, mutate) {
        if (description === void 0) { description = 'reorder'; }
        if (mutate === void 0) { mutate = true; }
        var newView = (0, boardView_1.createBoardView)(view);
        newView.fields.cardOrder = cardOrder;
        if (mutate) {
            return this.updateBlock(newView, view, description);
        }
        else {
            return { newBlock: newView, block: view };
        }
    };
    Mutator.prototype.followBlock = function (blockId, blockType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, octoClient_1["default"].followBlock(blockId, blockType, userId)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, octoClient_1["default"].unfollowBlock(blockId, blockType, userId)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'follow block', this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.unfollowBlock = function (blockId, blockType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].perform(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, octoClient_1["default"].unfollowBlock(blockId, blockType, userId)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, octoClient_1["default"].followBlock(blockId, blockType, userId)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, 'follow block', this.undoGroupId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Duplicate
    Mutator.prototype.duplicateCard = function (_a) {
        var cardId = _a.cardId, board = _a.board, _b = _a.description, description = _b === void 0 ? 'duplicate card' : _b, _c = _a.asTemplate, asTemplate = _c === void 0 ? false : _c, afterRedo = _a.afterRedo, beforeUndo = _a.beforeUndo, cardPage = _a.cardPage;
        return __awaiter(this, void 0, void 0, function () {
            var blocks, _d, newBlocks1, newCard, newBlocks;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, charmClient_1["default"].getSubtree(cardId, 2)];
                    case 1:
                        blocks = _e.sent();
                        _d = octoUtils_1.OctoUtils.duplicateBlockTree(blocks, cardId), newBlocks1 = _d[0], newCard = _d[1];
                        newBlocks = newBlocks1.filter(function (o) { return o.type !== 'comment'; });
                        utils_1.Utils.log("duplicateCard: duplicating ".concat(newBlocks.length, " blocks"));
                        if (asTemplate === newCard.fields.isTemplate) {
                            // Copy template
                            newCard.title = "".concat(cardPage.title, " copy");
                        }
                        else if (asTemplate) {
                            // Template from card
                            newCard.title = 'New card template';
                        }
                        else {
                            // Card from template
                            newCard.title = '';
                        }
                        newCard.fields.isTemplate = asTemplate;
                        newCard.rootId = board.id;
                        newCard.parentId = board.id;
                        newCard.fields.icon = cardPage.icon || undefined;
                        newCard.fields.headerImage = cardPage.headerImage || undefined;
                        newCard.fields.content = cardPage.content;
                        newCard.fields.contentText = cardPage.contentText;
                        return [4 /*yield*/, this.insertBlocks(newBlocks, description, function (respBlocks) { return __awaiter(_this, void 0, void 0, function () {
                                var card;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            card = respBlocks.find(function (block) { return block.type === 'card'; });
                                            if (!card) return [3 /*break*/, 2];
                                            return [4 /*yield*/, (afterRedo === null || afterRedo === void 0 ? void 0 : afterRedo(card.id))];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            utils_1.Utils.logError('card not found for opening.');
                                            _a.label = 3;
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }, beforeUndo)];
                    case 2:
                        _e.sent();
                        return [2 /*return*/, [newBlocks, newCard.id]];
                }
            });
        });
    };
    Mutator.prototype.duplicateBoard = function (boardId, description, asTemplate, afterRedo, beforeUndo) {
        if (description === void 0) { description = 'duplicate board'; }
        if (asTemplate === void 0) { asTemplate = false; }
        return __awaiter(this, void 0, void 0, function () {
            var blocks, _a, newBlocks1, newBoard, newBlocks, createdBlocks;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, charmClient_1["default"].getSubtree(boardId, 3)];
                    case 1:
                        blocks = _b.sent();
                        _a = octoUtils_1.OctoUtils.duplicateBlockTree(blocks, boardId), newBlocks1 = _a[0], newBoard = _a[1];
                        newBlocks = newBlocks1.filter(function (o) { return o.type !== 'comment'; });
                        utils_1.Utils.log("duplicateBoard: duplicating ".concat(newBlocks.length, " blocks"));
                        if (asTemplate === newBoard.fields.isTemplate) {
                            newBoard.title = "".concat(newBoard.title, " copy");
                        }
                        else if (asTemplate) {
                            // Template from board
                            newBoard.title = 'New board template';
                        }
                        else {
                            // Board from template
                        }
                        newBoard.fields.isTemplate = asTemplate;
                        return [4 /*yield*/, this.insertBlocks(newBlocks, description, function (respBlocks) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, (afterRedo === null || afterRedo === void 0 ? void 0 : afterRedo(respBlocks[0].id))];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, beforeUndo)];
                    case 2:
                        createdBlocks = _b.sent();
                        return [2 /*return*/, [createdBlocks, createdBlocks[0].id]];
                }
            });
        });
    };
    Mutator.prototype.duplicateFromRootBoard = function (boardId, description, asTemplate, afterRedo, beforeUndo) {
        if (description === void 0) { description = 'duplicate board'; }
        if (asTemplate === void 0) { asTemplate = false; }
        return __awaiter(this, void 0, void 0, function () {
            var rootClient, blocks, _a, newBlocks1, newBoard, newBlocks, createdBlocks;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rootClient = new octoClient_1.OctoClient(octoClient_1["default"].serverUrl, '0');
                        return [4 /*yield*/, rootClient.getSubtree(boardId, 3, '0')];
                    case 1:
                        blocks = _b.sent();
                        _a = octoUtils_1.OctoUtils.duplicateBlockTree(blocks, boardId), newBlocks1 = _a[0], newBoard = _a[1];
                        newBlocks = newBlocks1.filter(function (o) { return o.type !== 'comment'; });
                        utils_1.Utils.log("duplicateBoard: duplicating ".concat(newBlocks.length, " blocks"));
                        if (asTemplate === newBoard.fields.isTemplate) {
                            newBoard.title = "".concat(newBoard.title, " copy");
                        }
                        else if (asTemplate) {
                            // Template from board
                            newBoard.title = 'New board template';
                        }
                        else {
                            // Board from template
                        }
                        newBoard.fields.isTemplate = asTemplate;
                        return [4 /*yield*/, this.insertBlocks(newBlocks, description, function (respBlocks) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, (afterRedo === null || afterRedo === void 0 ? void 0 : afterRedo(respBlocks[0].id))];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, beforeUndo)];
                    case 2:
                        createdBlocks = _b.sent();
                        return [2 /*return*/, [createdBlocks, createdBlocks[0].id]];
                }
            });
        });
    };
    // Other methods
    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    Mutator.prototype.exportArchive = function (boardID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, octoClient_1["default"].exportArchive(boardID)];
            });
        });
    };
    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    Mutator.prototype.importFullArchive = function (blocks) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, octoClient_1["default"].importFullArchive(blocks)];
            });
        });
    };
    Object.defineProperty(Mutator.prototype, "canUndo", {
        get: function () {
            return undomanager_1["default"].canUndo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mutator.prototype, "canRedo", {
        get: function () {
            return undomanager_1["default"].canRedo;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mutator.prototype, "undoDescription", {
        get: function () {
            return undomanager_1["default"].undoDescription;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Mutator.prototype, "redoDescription", {
        get: function () {
            return undomanager_1["default"].redoDescription;
        },
        enumerable: false,
        configurable: true
    });
    Mutator.prototype.undo = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].undo()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Mutator.prototype.redo = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, undomanager_1["default"].redo()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Mutator;
}());
var mutator = new Mutator();
exports.mutator = mutator;
exports["default"] = mutator;
