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
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var testUtils_1 = require("../testUtils");
var testBlockFactory_1 = require("../test/testBlockFactory");
var utils_1 = require("../utils");
var mutator_1 = require("../mutator");
var constants_1 = require("../constants");
var centerPanel_1 = require("./centerPanel");
Object.defineProperty(constants_1.Constants, 'versionString', { value: '1.0.0' });
jest.mock('react-router-dom', function () {
    var originalModule = jest.requireActual('react-router-dom');
    return __assign(__assign({}, originalModule), { useRouteMatch: jest.fn(function () {
            return { url: '/board/view' };
        }) });
});
jest.mock('../utils');
jest.mock('../mutator');
jest.mock('../telemetry/telemetryClient');
var mockedUtils = jest.mocked(utils_1.Utils, true);
var mockedMutator = jest.mocked(mutator_1["default"], true);
mockedUtils.createGuid.mockReturnValue('test-id');
describe('components/centerPanel', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.id = '1';
    board.rootId = '1';
    var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    activeView.id = '1';
    var card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card1.id = '1';
    card1.title = 'card1';
    card1.fields.properties = { id: 'property_value_id_1' };
    var card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card2.id = '2';
    card2.title = 'card2';
    card2.fields.properties = { id: 'property_value_id_1' };
    var comment1 = testBlockFactory_1.TestBlockFactory.createComment(card1);
    comment1.id = '1';
    var comment2 = testBlockFactory_1.TestBlockFactory.createComment(card2);
    comment2.id = '2';
    var groupProperty = {
        id: 'id',
        name: 'name',
        type: 'text',
        options: [
            {
                color: 'propColorOrange',
                id: 'property_value_id_1',
                value: 'Q1'
            },
            {
                color: 'propColorBlue',
                id: 'property_value_id_2',
                value: 'Q2'
            }
        ]
    };
    var state = {
        clientConfig: {
            value: {
                featureFlags: {
                    subscriptions: true
                }
            }
        },
        searchText: '',
        users: {
            me: {},
            workspaceUsers: [
                { username: 'username_1' }
            ],
            blockSubscriptions: []
        },
        boards: {
            current: board.id
        },
        cards: {
            templates: [card1, card2],
            cards: [card1, card2]
        },
        views: {
            views: {
                boardView: activeView
            },
            current: 'boardView'
        },
        contents: {},
        comments: {
            comments: [comment1, comment2]
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeAll(function () {
        (0, testUtils_1.mockDOM)();
        console.error = jest.fn();
    });
    beforeEach(function () {
        activeView.fields.viewType = 'board';
        jest.clearAllMocks();
    });
    test('should match snapshot for Kanban', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <centerPanel_1["default"] cards={[card1]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot for Gallery', function () {
        activeView.fields.viewType = 'gallery';
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <centerPanel_1["default"] cards={[card1]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot for Table', function () {
        activeView.fields.viewType = 'table';
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <centerPanel_1["default"] cards={[card1]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    describe('return centerPanel and', function () {
        test('select one card and click background', function () {
            activeView.fields.viewType = 'table';
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            // select card
            var cardElement = react_1.screen.getByRole('textbox', { name: 'card1' });
            expect(cardElement).not.toBeNull();
            user_event_1["default"].click(cardElement, { shiftKey: true });
            expect(container).toMatchSnapshot();
            // background
            var boardElement = container.querySelector('.BoardComponent');
            expect(boardElement).not.toBeNull();
            user_event_1["default"].click(boardElement);
            expect(container).toMatchSnapshot();
        });
        test('press touch 1 with readonly', function () {
            activeView.fields.viewType = 'table';
            var _a = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={true} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)), container = _a.container, baseElement = _a.baseElement;
            // touch '1'
            react_1.fireEvent.keyDown(baseElement, { keyCode: 49 });
            expect(container).toMatchSnapshot();
        });
        test('press touch esc for one card selected', function () {
            activeView.fields.viewType = 'table';
            var _a = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)), container = _a.container, baseElement = _a.baseElement;
            var cardElement = react_1.screen.getByRole('textbox', { name: 'card1' });
            expect(cardElement).not.toBeNull();
            user_event_1["default"].click(cardElement, { shiftKey: true });
            expect(container).toMatchSnapshot();
            // escape
            react_1.fireEvent.keyDown(baseElement, { keyCode: 27 });
            expect(container).toMatchSnapshot();
        });
        test('press touch esc for two cards selected', function () { return __awaiter(void 0, void 0, void 0, function () {
            var _a, container, baseElement, card1Element, card2Element;
            return __generator(this, function (_b) {
                activeView.fields.viewType = 'table';
                _a = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)), container = _a.container, baseElement = _a.baseElement;
                card1Element = react_1.screen.getByRole('textbox', { name: 'card1' });
                expect(card1Element).not.toBeNull();
                user_event_1["default"].click(card1Element, { shiftKey: true });
                expect(container).toMatchSnapshot();
                card2Element = react_1.screen.getByRole('textbox', { name: 'card2' });
                expect(card2Element).not.toBeNull();
                user_event_1["default"].click(card2Element, { shiftKey: true, ctrlKey: true });
                expect(container).toMatchSnapshot();
                // escape
                react_1.fireEvent.keyDown(baseElement, { keyCode: 27 });
                expect(container).toMatchSnapshot();
                return [2 /*return*/];
            });
        }); });
        test('press touch del for one card selected', function () {
            activeView.fields.viewType = 'table';
            var _a = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)), container = _a.container, baseElement = _a.baseElement;
            var cardElement = react_1.screen.getByRole('textbox', { name: 'card1' });
            expect(cardElement).not.toBeNull();
            user_event_1["default"].click(cardElement, { shiftKey: true });
            expect(container).toMatchSnapshot();
            // delete
            react_1.fireEvent.keyDown(baseElement, { keyCode: 8 });
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
        });
        test('press touch ctrl+d for one card selected', function () {
            activeView.fields.viewType = 'table';
            var _a = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)), container = _a.container, baseElement = _a.baseElement;
            var cardElement = react_1.screen.getByRole('textbox', { name: 'card1' });
            expect(cardElement).not.toBeNull();
            user_event_1["default"].click(cardElement, { shiftKey: true });
            expect(container).toMatchSnapshot();
            // ctrl+d
            react_1.fireEvent.keyDown(baseElement, { ctrlKey: true, keyCode: 68 });
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
        });
        test('click on card to show card', function () {
            activeView.fields.viewType = 'board';
            var mockedShowCard = jest.fn();
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={mockedShowCard} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            var kanbanCardElements = container.querySelectorAll('.KanbanCard');
            expect(kanbanCardElements).not.toBeNull();
            var kanbanCardElement = kanbanCardElements[0];
            user_event_1["default"].click(kanbanCardElement);
            expect(container).toMatchSnapshot();
            expect(mockedShowCard).toBeCalledWith(card1.id);
        });
        test('click on new card to add card', function () {
            activeView.fields.viewType = 'table';
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            var buttonWithMenuElement = container.querySelector('.ButtonWithMenu');
            expect(buttonWithMenuElement).not.toBeNull();
            user_event_1["default"].click(buttonWithMenuElement);
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
        });
        test('click on new card to add card template', function () {
            activeView.fields.viewType = 'table';
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            var elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper');
            expect(elementMenuWrapper).not.toBeNull();
            user_event_1["default"].click(elementMenuWrapper);
            var buttonNewTemplate = (0, react_1.within)(elementMenuWrapper.parentElement).getByRole('button', { name: 'New template' });
            user_event_1["default"].click(buttonNewTemplate);
            expect(mockedMutator.insertBlock).toBeCalledTimes(1);
        });
        test('click on new card to add card from template', function () {
            activeView.fields.viewType = 'table';
            activeView.fields.defaultTemplateId = '1';
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            var elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper');
            expect(elementMenuWrapper).not.toBeNull();
            user_event_1["default"].click(elementMenuWrapper);
            var elementCard1 = (0, react_1.within)(elementMenuWrapper.parentElement).getByRole('button', { name: 'card1' });
            expect(elementCard1).not.toBeNull();
            user_event_1["default"].click(elementCard1);
            expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
        });
        test('click on new card to edit template', function () {
            activeView.fields.viewType = 'table';
            activeView.fields.defaultTemplateId = '1';
            var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
          <centerPanel_1["default"] cards={[card1, card2]} setPage={function () { }} views={[activeView]} board={board} activeView={activeView} readonly={false} showCard={jest.fn()} groupByProperty={groupProperty}/>
        </react_redux_1.Provider>)).container;
            var elementMenuWrapper = container.querySelector('.ButtonWithMenu > div.MenuWrapper');
            expect(elementMenuWrapper).not.toBeNull();
            user_event_1["default"].click(elementMenuWrapper);
            var elementCard1 = (0, react_1.within)(elementMenuWrapper.parentElement).getByRole('button', { name: 'card1' });
            expect(elementCard1).not.toBeNull();
            var elementMenuWrapperCard1 = (0, react_1.within)(elementCard1).getByRole('button', { name: 'menuwrapper' });
            expect(elementMenuWrapperCard1).not.toBeNull();
            user_event_1["default"].click(elementMenuWrapperCard1);
            var elementEditMenuTemplate = (0, react_1.within)(elementMenuWrapperCard1).getByRole('button', { name: 'Edit' });
            expect(elementMenuWrapperCard1).not.toBeNull();
            user_event_1["default"].click(elementEditMenuTemplate);
            expect(container).toMatchSnapshot();
        });
    });
});
