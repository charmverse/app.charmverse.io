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
var react_1 = require("react");
require("isomorphic-fetch");
var react_2 = require("@testing-library/react");
var redux_mock_store_1 = require("redux-mock-store");
var react_redux_1 = require("react-redux");
var fetchMock_1 = require("../../test/fetchMock");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var cardDetail_1 = require("./cardDetail");
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
// This is needed to run EasyMDE in tests.
// It needs bounding rectangle box property
// on HTML elements, but Jest's HTML engine jsdom
// doesn't provide it.
// So we mock it.
beforeAll(function () {
    (0, testUtils_1.mockDOM)();
});
describe('components/cardDetail/CardDetail', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view.fields.sortOptions = [];
    view.fields.groupById = undefined;
    view.fields.hiddenOptionIds = [];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var createdAt = Date.parse('01 Jan 2021 00:00:00 GMT');
    var comment1 = testBlockFactory_1.TestBlockFactory.createComment(card);
    comment1.type = 'comment';
    comment1.title = 'Comment 1';
    comment1.parentId = card.id;
    comment1.createdAt = createdAt;
    var comment2 = testBlockFactory_1.TestBlockFactory.createComment(card);
    comment2.type = 'comment';
    comment2.title = 'Comment 2';
    comment2.parentId = card.id;
    comment2.createdAt = createdAt;
    test('should show comments', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockStore, store, component, container, comments, newCommentSection;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockStore = (0, redux_mock_store_1["default"])([]);
                    store = mockStore({
                        users: {
                            workspaceUsers: [
                                { username: 'username_1' }
                            ]
                        }
                    });
                    component = (<react_redux_1.Provider store={store}>
        {(0, testUtils_1.wrapIntl)(<cardDetail_1["default"] card={card} readonly={false}/>)}
      </react_redux_1.Provider>);
                    container = null;
                    return [4 /*yield*/, (0, react_2.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_2.render)(component);
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toBeDefined();
                    comments = container.querySelectorAll('.comment-text');
                    expect(comments.length).toBe(2);
                    newCommentSection = container.querySelectorAll('.newcomment');
                    expect(newCommentSection.length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should show comments in readonly view', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockStore, store, component, container, comments, newCommentSection;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockStore = (0, redux_mock_store_1["default"])([]);
                    store = mockStore({
                        users: {
                            workspaceUsers: [
                                { username: 'username_1' }
                            ]
                        }
                    });
                    component = (<react_redux_1.Provider store={store}>
        {(0, testUtils_1.wrapIntl)(<cardDetail_1["default"] card={card} readonly={true}/>)}
      </react_redux_1.Provider>);
                    container = null;
                    return [4 /*yield*/, (0, react_2.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_2.render)(component);
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toBeDefined();
                    comments = container.querySelectorAll('.comment-text');
                    expect(comments.length).toBe(2);
                    newCommentSection = container.querySelectorAll('.newcomment');
                    expect(newCommentSection.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
});
