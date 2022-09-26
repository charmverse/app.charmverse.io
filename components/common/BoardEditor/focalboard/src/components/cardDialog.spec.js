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
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var mutator_1 = require("../mutator");
var utils_1 = require("../utils");
var testBlockFactory_1 = require("../test/testBlockFactory");
var testUtils_1 = require("../testUtils");
var cardDialog_1 = require("./cardDialog");
jest.mock('../mutator');
jest.mock('../utils');
var mockedUtils = jest.mocked(utils_1.Utils, true);
var mockedMutator = jest.mocked(mutator_1["default"], true);
mockedUtils.createGuid.mockReturnValue('test-id');
beforeAll(function () {
    (0, testUtils_1.mockDOM)();
});
describe('components/cardDialog', function () {
    var _a;
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.fields.cardProperties = [];
    board.id = 'test-id';
    board.rootId = board.id;
    var boardView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    boardView.id = board.id;
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.id = board.id;
    card.createdBy = 'user-id-1';
    var state = {
        clientConfig: {
            value: {
                featureFlags: {
                    subscriptions: true
                }
            }
        },
        comments: {
            comments: {}
        },
        contents: {},
        cards: {
            cards: (_a = {},
                _a[card.id] = card,
                _a)
        },
        users: {
            workspaceUsers: {
                1: { username: 'abc' },
                2: { username: 'd' },
                3: { username: 'e' },
                4: { username: 'f' },
                5: { username: 'g' }
            },
            blockSubscriptions: []
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return a cardDialog readonly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={true}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog and do a close action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var closeFn, buttonElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closeFn = jest.fn();
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={closeFn} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    buttonElement = react_1.screen.getByRole('button', { name: 'Close dialog' });
                    user_event_1["default"].click(buttonElement);
                    expect(closeFn).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog menu content', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, buttonMenu;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    buttonMenu = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
                    user_event_1["default"].click(buttonMenu);
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog menu content and verify delete action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var buttonMenu, buttonDelete, confirmDialog, confirmButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    buttonMenu = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
                    user_event_1["default"].click(buttonMenu);
                    buttonDelete = react_1.screen.getByRole('button', { name: 'Delete' });
                    user_event_1["default"].click(buttonDelete);
                    confirmDialog = react_1.screen.getByTitle('Confirmation Dialog Box');
                    expect(confirmDialog).toBeDefined();
                    confirmButton = react_1.screen.getByTitle('Delete');
                    expect(confirmButton).toBeDefined();
                    // click delete button
                    user_event_1["default"].click(confirmButton);
                    // should be called once on confirming delete
                    expect(mockedMutator.deleteBlock).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog menu content and cancel delete confirmation do nothing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, buttonMenu, buttonDelete, confirmDialog, cancelButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    buttonMenu = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
                    user_event_1["default"].click(buttonMenu);
                    buttonDelete = react_1.screen.getByRole('button', { name: 'Delete' });
                    user_event_1["default"].click(buttonDelete);
                    confirmDialog = react_1.screen.getByTitle('Confirmation Dialog Box');
                    expect(confirmDialog).toBeDefined();
                    cancelButton = react_1.screen.getByTitle('Cancel');
                    expect(cancelButton).toBeDefined();
                    // click delete button
                    user_event_1["default"].click(cancelButton);
                    // should do nothing  on cancel delete dialog
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog menu content and do a New template from card', function () { return __awaiter(void 0, void 0, void 0, function () {
        var buttonMenu, buttonTemplate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    buttonMenu = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
                    user_event_1["default"].click(buttonMenu);
                    buttonTemplate = react_1.screen.getByRole('button', { name: 'New template from card' });
                    user_event_1["default"].click(buttonTemplate);
                    expect(mockedMutator.duplicateCard).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('return cardDialog menu content and do a copy Link', function () { return __awaiter(void 0, void 0, void 0, function () {
        var buttonMenu, buttonCopy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    buttonMenu = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
                    user_event_1["default"].click(buttonMenu);
                    buttonCopy = react_1.screen.getByRole('button', { name: 'Copy link' });
                    user_event_1["default"].click(buttonCopy);
                    expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('already following card', function () { return __awaiter(void 0, void 0, void 0, function () {
        var newState, newStore, container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newState = JSON.parse(JSON.stringify(state));
                    newState.users.blockSubscriptions = [{ blockId: card.id }];
                    newState.clientConfig = {
                        value: {
                            featureFlags: {
                                subscriptions: true
                            }
                        }
                    };
                    newStore = (0, testUtils_1.mockStateStore)([], newState);
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={newStore}>
          <cardDialog_1["default"] board={board} cardId={card.id} onClose={jest.fn()} showCard={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>));
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
});
