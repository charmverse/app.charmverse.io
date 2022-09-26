"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var react_redux_1 = require("react-redux");
var react_2 = require("@testing-library/react");
var redux_mock_store_1 = require("redux-mock-store");
require("@testing-library/jest-dom");
require("isomorphic-fetch");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var fetchMock_1 = require("../../test/fetchMock");
var utils_1 = require("../../utils");
var testUtils_1 = require("../../testUtils");
var table_1 = require("./table");
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
describe('components/table/Table', function () {
    var _a;
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'table';
    view.fields.groupById = undefined;
    view.fields.visiblePropertyIds = ['property1', 'property2'];
    var view2 = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view2.fields.sortOptions = [];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var cardTemplate = testBlockFactory_1.TestBlockFactory.createCard(board);
    cardTemplate.fields.isTemplate = true;
    var state = {
        users: {
            workspaceUsers: {
                'user-id-1': { username: 'username_1' },
                'user-id-2': { username: 'username_2' },
                'user-id-3': { username: 'username_3' },
                'user-id-4': { username: 'username_4' }
            }
        },
        comments: {
            comments: {}
        },
        contents: {
            contents: {}
        },
        cards: {
            cards: (_a = {},
                _a[card.id] = card,
                _a)
        }
    };
    test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callback, addCard, mockStore, store, component, container;
        return __generator(this, function (_a) {
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card]} views={[view, view2]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, read-only', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callback, addCard, mockStore, store, component, container;
        return __generator(this, function (_a) {
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card]} views={[view, view2]} selectedCardIds={[]} readonly={true} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot with GroupBy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callback, addCard, mockStore, store, component, container;
        return __generator(this, function (_a) {
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={__assign(__assign({}, view), { fields: __assign(__assign({}, view.fields), { groupById: 'property1' }) })} visibleGroups={[{ option: { id: '', value: 'test', color: '' }, cards: [] }]} groupByProperty={{
                    id: '',
                    name: 'Property 1',
                    type: 'text',
                    options: [{ id: 'property1', value: 'Property 1', color: '' }]
                }} cards={[card]} views={[view, view2]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
});
describe('components/table/Table extended', function () {
    var state = {
        users: {
            workspaceUsers: {
                'user-id-1': { username: 'username_1' },
                'user-id-2': { username: 'username_2' },
                'user-id-3': { username: 'username_3' },
                'user-id-4': { username: 'username_4' }
            }
        },
        comments: {
            comments: {}
        },
        contents: {
            contents: {}
        },
        cards: {
            cards: {}
        }
    };
    test('should match snapshot with CreatedBy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var board, dateCreatedId, card1, card2, view, callback, addCard, mockStore, store, component, container;
        var _a;
        return __generator(this, function (_b) {
            board = testBlockFactory_1.TestBlockFactory.createBoard();
            dateCreatedId = utils_1.Utils.createGuid(utils_1.IDType.User);
            board.fields.cardProperties.push({
                id: dateCreatedId,
                name: 'Date Created',
                type: 'createdTime',
                options: []
            });
            card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card1.createdAt = Date.parse('15 Jun 2021 16:22:00');
            card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2.createdAt = Date.parse('15 Jun 2021 16:22:00');
            view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
            view.fields.viewType = 'table';
            view.fields.groupById = undefined;
            view.fields.visiblePropertyIds = ['property1', 'property2', dateCreatedId];
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(__assign(__assign({}, state), { cards: {
                    cards: (_a = {},
                        _a[card1.id] = card1,
                        _a[card2.id] = card2,
                        _a)
                } }));
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card1, card2]} views={[view]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot with UpdatedAt', function () { return __awaiter(void 0, void 0, void 0, function () {
        var board, dateUpdatedId, card1, card2, card2Comment, card2Text, view, callback, addCard, mockStore, store, component, container;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            board = testBlockFactory_1.TestBlockFactory.createBoard();
            dateUpdatedId = utils_1.Utils.createGuid(utils_1.IDType.User);
            board.fields.cardProperties.push({
                id: dateUpdatedId,
                name: 'Date Updated',
                type: 'updatedTime',
                options: []
            });
            card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card1.updatedAt = Date.parse('20 Jun 2021 12:22:00');
            card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2.updatedAt = Date.parse('20 Jun 2021 12:22:00');
            card2Comment = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2Comment.parentId = card2.id;
            card2Comment.type = 'comment';
            card2Comment.updatedAt = Date.parse('21 Jun 2021 15:23:00');
            card2Text = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2Text.parentId = card2.id;
            card2Text.type = 'text';
            card2Text.updatedAt = Date.parse('22 Jun 2021 11:23:00');
            card2.fields.contentOrder = [card2Text.id];
            view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
            view.fields.viewType = 'table';
            view.fields.groupById = undefined;
            view.fields.visiblePropertyIds = ['property1', 'property2', dateUpdatedId];
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(__assign(__assign({}, state), { comments: {
                    comments: (_a = {},
                        _a[card2Comment.id] = card2Comment,
                        _a)
                }, contents: {
                    contents: (_b = {},
                        _b[card2Text.id] = card2Text,
                        _b)
                }, cards: {
                    cards: (_c = {},
                        _c[card1.id] = card1,
                        _c[card2.id] = card2,
                        _c)
                } }));
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card1, card2]} views={[view]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot with CreatedBy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var board, createdById, card1, card2, view, callback, addCard, mockStore, store, component, container;
        var _a;
        return __generator(this, function (_b) {
            board = testBlockFactory_1.TestBlockFactory.createBoard();
            createdById = utils_1.Utils.createGuid(utils_1.IDType.User);
            board.fields.cardProperties.push({
                id: createdById,
                name: 'Created By',
                type: 'createdBy',
                options: []
            });
            card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card1.createdBy = 'user-id-1';
            card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2.createdBy = 'user-id-2';
            view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
            view.fields.viewType = 'table';
            view.fields.groupById = undefined;
            view.fields.visiblePropertyIds = ['property1', 'property2', createdById];
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(__assign(__assign({}, state), { cards: {
                    cards: (_a = {},
                        _a[card1.id] = card1,
                        _a[card2.id] = card2,
                        _a)
                } }));
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card1, card2]} views={[view]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot with UpdatedBy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var board, updatedById, card1, card1Text, card2, card2Comment, view, callback, addCard, mockStore, store, component, container;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            board = testBlockFactory_1.TestBlockFactory.createBoard();
            updatedById = utils_1.Utils.createGuid(utils_1.IDType.User);
            board.fields.cardProperties.push({
                id: updatedById,
                name: 'Last Modified By',
                type: 'updatedBy',
                options: []
            });
            card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card1.updatedBy = 'user-id-1';
            card1.updatedAt = Date.parse('15 Jun 2021 16:22:00');
            card1Text = testBlockFactory_1.TestBlockFactory.createCard(board);
            card1Text.parentId = card1.id;
            card1Text.type = 'text';
            card1Text.updatedBy = 'user-id-4';
            card1Text.updatedAt = Date.parse('16 Jun 2021 16:22:00');
            card1.fields.contentOrder = [card1Text.id];
            card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2.updatedBy = 'user-id-2';
            card2.updatedAt = Date.parse('15 Jun 2021 16:22:00');
            card2Comment = testBlockFactory_1.TestBlockFactory.createCard(board);
            card2Comment.parentId = card2.id;
            card2Comment.type = 'comment';
            card2Comment.updatedBy = 'user-id-3';
            card2.updatedAt = Date.parse('16 Jun 2021 16:22:00');
            view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
            view.fields.viewType = 'table';
            view.fields.groupById = undefined;
            view.fields.visiblePropertyIds = ['property1', 'property2', updatedById];
            callback = jest.fn();
            addCard = jest.fn();
            mockStore = (0, redux_mock_store_1["default"])([]);
            store = mockStore(__assign(__assign({}, state), { comments: {
                    comments: (_a = {},
                        _a[card2Comment.id] = card2Comment,
                        _a)
                }, contents: {
                    contents: (_b = {},
                        _b[card1Text.id] = card1Text,
                        _b)
                }, cards: {
                    cards: (_c = {},
                        _c[card1.id] = card1,
                        _c[card2.id] = card2,
                        _c)
                } }));
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <table_1["default"] board={board} activeView={view} visibleGroups={[]} cards={[card1, card2]} views={[view]} selectedCardIds={[]} readonly={false} cardIdToFocusOnRender='' showCard={callback} addCard={addCard} onCardClicked={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
});
