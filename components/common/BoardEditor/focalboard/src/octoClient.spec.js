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
var board_1 = require("./blocks/board");
var octoClient_1 = require("./octoClient");
require("isomorphic-fetch");
var fetchMock_1 = require("./test/fetchMock");
console.log = jest.fn();
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
test('OctoClient: get blocks', function () { return __awaiter(void 0, void 0, void 0, function () {
    var blocks, boards, parentId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blocks = createBoards();
                fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify(blocks)));
                return [4 /*yield*/, octoClient_1["default"].getBlocksWithType('board')];
            case 1:
                boards = _a.sent();
                expect(boards.length).toBe(blocks.length);
                fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify(blocks)));
                return [4 /*yield*/, octoClient_1["default"].getSubtree()];
            case 2:
                boards = _a.sent();
                expect(boards.length).toBe(blocks.length);
                fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify(blocks)));
                return [4 /*yield*/, octoClient_1["default"].exportArchive()];
            case 3:
                boards = _a.sent();
                expect(boards.length).toBe(blocks.length);
                fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify(blocks)));
                parentId = 'id1';
                return [4 /*yield*/, octoClient_1["default"].getBlocksWithParent(parentId)];
            case 4:
                boards = _a.sent();
                expect(boards.length).toBe(blocks.length);
                fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify(blocks)));
                return [4 /*yield*/, octoClient_1["default"].getBlocksWithParent(parentId, 'board')];
            case 5:
                boards = _a.sent();
                expect(boards.length).toBe(blocks.length);
                return [2 /*return*/];
        }
    });
}); });
test('OctoClient: insert blocks', function () { return __awaiter(void 0, void 0, void 0, function () {
    var blocks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blocks = createBoards();
                return [4 /*yield*/, octoClient_1["default"].insertBlocks(blocks)];
            case 1:
                _a.sent();
                expect(fetchMock_1.FetchMock.fn).toBeCalledTimes(1);
                expect(fetchMock_1.FetchMock.fn).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(blocks)
                }));
                return [2 /*return*/];
        }
    });
}); });
test('OctoClient: importFullArchive', function () { return __awaiter(void 0, void 0, void 0, function () {
    var blocks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blocks = createBoards();
                return [4 /*yield*/, octoClient_1["default"].importFullArchive(blocks)];
            case 1:
                _a.sent();
                expect(fetchMock_1.FetchMock.fn).toBeCalledTimes(1);
                expect(fetchMock_1.FetchMock.fn).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(blocks)
                }));
                return [2 /*return*/];
        }
    });
}); });
function createBoards() {
    var blocks = [];
    for (var i = 0; i < 5; i++) {
        var board = (0, board_1.createBoard)();
        board.id = "board".concat(i + 1);
        blocks.push(board);
    }
    return blocks;
}
