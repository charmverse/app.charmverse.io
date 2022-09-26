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
var mutator_1 = require("./mutator");
var testBlockFactory_1 = require("./test/testBlockFactory");
require("isomorphic-fetch");
var fetchMock_1 = require("./test/fetchMock");
var testUtils_1 = require("./testUtils");
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
beforeAll(function () {
    (0, testUtils_1.mockDOM)();
});
describe('Mutator', function () {
    test('changePropertyValue', function () { return __awaiter(void 0, void 0, void 0, function () {
        var card;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    card = testBlockFactory_1.TestBlockFactory.createCard();
                    card.fields.properties.property_1 = 'hello';
                    return [4 /*yield*/, mutator_1["default"].changePropertyValue(card, 'property_1', 'hello')];
                case 1:
                    _a.sent();
                    // No API call should be made as property value DIDN'T CHANGE
                    expect(fetchMock_1.FetchMock.fn).toBeCalledTimes(0);
                    return [4 /*yield*/, mutator_1["default"].changePropertyValue(card, 'property_1', 'hello world')];
                case 2:
                    _a.sent();
                    // 1 API call should be made as property value DID CHANGE
                    expect(fetchMock_1.FetchMock.fn).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('duplicateCard', function () { return __awaiter(void 0, void 0, void 0, function () {
        var card, board, _a, newBlocks, newCardID, duplicatedCard;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    card = testBlockFactory_1.TestBlockFactory.createCard();
                    board = testBlockFactory_1.TestBlockFactory.createBoard();
                    fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify([card])));
                    fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify([])));
                    return [4 /*yield*/, mutator_1["default"].duplicateCard(card.id)];
                case 1:
                    _a = _b.sent(), newBlocks = _a[0], newCardID = _a[1];
                    expect(newBlocks).toHaveLength(1);
                    duplicatedCard = newBlocks[0];
                    expect(duplicatedCard.type).toBe('card');
                    expect(duplicatedCard.id).toBe(newCardID);
                    expect(duplicatedCard.fields.icon).toBe(card.fields.icon);
                    expect(duplicatedCard.fields.contentOrder).toHaveLength(card.fields.contentOrder.length);
                    expect(duplicatedCard.parentId).toBe(board.id);
                    expect(duplicatedCard.rootId).toBe(board.id);
                    return [2 /*return*/];
            }
        });
    }); });
});
