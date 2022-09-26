"use strict";
// @ts-nocheck
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
var octoUtils_1 = require("./octoUtils");
var testBlockFactory_1 = require("./test/testBlockFactory");
test('duplicateBlockTree: Board', function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, blocks, sourceBlock, _b, newBlocks, newSourceBlock, idMap, _i, newBlocks_1, newBlock, _c, _d, textBlock;
    return __generator(this, function (_e) {
        _a = createBoardTree(), blocks = _a[0], sourceBlock = _a[1];
        _b = octoUtils_1.OctoUtils.duplicateBlockTree(blocks, sourceBlock.id), newBlocks = _b[0], newSourceBlock = _b[1], idMap = _b[2];
        expect(newBlocks.length).toBe(blocks.length);
        expect(newSourceBlock.id).not.toBe(sourceBlock);
        expect(newSourceBlock.type).toBe(sourceBlock.type);
        // When duplicating a root block, the rootId should be re-mapped
        expect(newSourceBlock.rootId).not.toBe(sourceBlock.rootId);
        expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id);
        for (_i = 0, newBlocks_1 = newBlocks; _i < newBlocks_1.length; _i++) {
            newBlock = newBlocks_1[_i];
            expect(newBlock.rootId).toBe(newSourceBlock.id);
        }
        for (_c = 0, _d = newBlocks.filter(function (o) { return o.type === 'card'; }); _c < _d.length; _c++) {
            textBlock = _d[_c];
            expect(textBlock.parentId).toBe(newSourceBlock.id);
        }
        return [2 /*return*/];
    });
}); });
test('duplicateBlockTree: Card', function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, blocks, sourceBlock, _b, newBlocks, newSourceBlock, idMap, _i, newBlocks_2, newBlock, _c, _d, textBlock;
    return __generator(this, function (_e) {
        _a = createCardTree(), blocks = _a[0], sourceBlock = _a[1];
        _b = octoUtils_1.OctoUtils.duplicateBlockTree(blocks, sourceBlock.id), newBlocks = _b[0], newSourceBlock = _b[1], idMap = _b[2];
        expect(newBlocks.length).toBe(blocks.length);
        expect(newSourceBlock.id).not.toBe(sourceBlock.id);
        expect(newSourceBlock.type).toBe(sourceBlock.type);
        // When duplicating a non-root block, the rootId should not be re-mapped
        expect(newSourceBlock.rootId).toBe(sourceBlock.rootId);
        expect(idMap[sourceBlock.id]).toBe(newSourceBlock.id);
        for (_i = 0, newBlocks_2 = newBlocks; _i < newBlocks_2.length; _i++) {
            newBlock = newBlocks_2[_i];
            expect(newBlock.rootId).toBe(newSourceBlock.rootId);
        }
        for (_c = 0, _d = newBlocks.filter(function (o) { return o.type === 'text'; }); _c < _d.length; _c++) {
            textBlock = _d[_c];
            expect(textBlock.parentId).toBe(newSourceBlock.id);
        }
        return [2 /*return*/];
    });
}); });
function createBoardTree() {
    var blocks = [];
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.id = 'board1';
    board.rootId = board.id;
    blocks.push(board);
    for (var i = 0; i < 5; i++) {
        var card = testBlockFactory_1.TestBlockFactory.createCard(board);
        card.id = "card".concat(i);
        blocks.push(card);
        for (var j = 0; j < 3; j++) {
            var textBlock = testBlockFactory_1.TestBlockFactory.createText(card);
            textBlock.id = "text".concat(j);
            blocks.push(textBlock);
        }
    }
    return [blocks, board];
}
function createCardTree() {
    var blocks = [];
    var card = testBlockFactory_1.TestBlockFactory.createCard();
    card.id = 'card1';
    card.rootId = 'board1';
    blocks.push(card);
    for (var i = 0; i < 5; i++) {
        var textBlock = testBlockFactory_1.TestBlockFactory.createText(card);
        textBlock.id = "text".concat(i);
        blocks.push(textBlock);
    }
    return [blocks, card];
}
