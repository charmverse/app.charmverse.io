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
exports.Archiver = void 0;
var archive_1 = require("./blocks/archive");
var lineReader_1 = require("./lineReader");
var mutator_1 = require("./mutator");
var utils_1 = require("./utils");
var Archiver = /** @class */ (function () {
    function Archiver() {
    }
    Archiver.exportBoardArchive = function (board) {
        return __awaiter(this, void 0, void 0, function () {
            var blocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mutator_1["default"].exportArchive(board.id)];
                    case 1:
                        blocks = _a.sent();
                        this.exportArchive(blocks);
                        return [2 /*return*/];
                }
            });
        });
    };
    Archiver.exportFullArchive = function () {
        return __awaiter(this, void 0, void 0, function () {
            var blocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mutator_1["default"].exportArchive()];
                    case 1:
                        blocks = _a.sent();
                        this.exportArchive(blocks);
                        return [2 /*return*/];
                }
            });
        });
    };
    Archiver.exportArchive = function (blocks) {
        var content = archive_1.ArchiveUtils.buildBlockArchive(blocks);
        var date = new Date();
        var filename = "archive-".concat(date.getFullYear(), "-").concat(date.getMonth() + 1, "-").concat(date.getDate(), ".focalboard");
        var link = document.createElement('a');
        link.style.display = 'none';
        // const file = new Blob([content], { type: "text/json" })
        // link.href = URL.createObjectURL(file)
        link.href = "data:text/json,".concat(encodeURIComponent(content));
        link.download = filename;
        document.body.appendChild(link); // FireFox support
        link.click();
        // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
        if (window.openInNewBrowser) {
            window.openInNewBrowser(link.href);
        }
        // TODO: Remove or reuse link
    };
    Archiver.importBlocksFromFile = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var blockCount, maxBlocksPerImport, blocks, isFirstLine;
            var _this = this;
            return __generator(this, function (_a) {
                blockCount = 0;
                maxBlocksPerImport = 1000;
                blocks = [];
                isFirstLine = true;
                return [2 /*return*/, new Promise(function (resolve) {
                        lineReader_1.LineReader.readFile(file, function (line, completed) { return __awaiter(_this, void 0, void 0, function () {
                            var header, date, row, _a, blockLine, block, blocksToSend;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!completed) return [3 /*break*/, 3];
                                        if (!(blocks.length > 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, mutator_1["default"].importFullArchive(blocks)];
                                    case 1:
                                        _b.sent();
                                        blockCount += blocks.length;
                                        _b.label = 2;
                                    case 2:
                                        utils_1.Utils.log("Imported ".concat(blockCount, " blocks."));
                                        resolve();
                                        return [2 /*return*/];
                                    case 3:
                                        if (!isFirstLine) return [3 /*break*/, 4];
                                        isFirstLine = false;
                                        header = JSON.parse(line);
                                        if (header.date && header.version >= 1) {
                                            date = new Date(header.date);
                                            utils_1.Utils.log("Import archive, version: ".concat(header.version, ", date/time: ").concat(date.toLocaleString(), "."));
                                        }
                                        return [3 /*break*/, 8];
                                    case 4:
                                        row = JSON.parse(line);
                                        if (!row || !row.type || !row.data) {
                                            utils_1.Utils.logError('importFullArchive ERROR parsing line');
                                            return [2 /*return*/];
                                        }
                                        _a = row.type;
                                        switch (_a) {
                                            case 'block': return [3 /*break*/, 5];
                                        }
                                        return [3 /*break*/, 8];
                                    case 5:
                                        blockLine = row;
                                        block = blockLine.data;
                                        if (!Archiver.isValidBlock(block)) return [3 /*break*/, 7];
                                        blocks.push(block);
                                        if (!(blocks.length >= maxBlocksPerImport)) return [3 /*break*/, 7];
                                        blocksToSend = blocks;
                                        blocks = [];
                                        return [4 /*yield*/, mutator_1["default"].importFullArchive(blocksToSend)];
                                    case 6:
                                        _b.sent();
                                        blockCount += blocksToSend.length;
                                        _b.label = 7;
                                    case 7: return [3 /*break*/, 8];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    Archiver.isValidBlock = function (block) {
        if (!block.id || !block.rootId) {
            return false;
        }
        return true;
    };
    Archiver.importFullArchive = function (onComplete) {
        var _this = this;
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.focalboard';
        input.onchange = function () { return __awaiter(_this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        file = input.files && input.files[0];
                        if (!file) return [3 /*break*/, 2];
                        return [4 /*yield*/, Archiver.importBlocksFromFile(file)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        onComplete === null || onComplete === void 0 ? void 0 : onComplete();
                        return [2 /*return*/];
                }
            });
        }); };
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        // TODO: Remove or reuse input
    };
    return Archiver;
}());
exports.Archiver = Archiver;
