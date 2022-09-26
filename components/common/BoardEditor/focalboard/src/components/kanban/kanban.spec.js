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
var mutator_1 = require("../../mutator");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var utils_1 = require("../../utils");
var kanban_1 = require("./kanban");
global.fetch = jest.fn();
jest.mock('../../utils');
var mockedUtils = jest.mocked(utils_1.Utils, true);
var mockedchangePropertyOptionValue = jest.spyOn(mutator_1.mutator, 'changePropertyOptionValue');
var mockedChangeViewCardOrder = jest.spyOn(mutator_1.mutator, 'changeViewCardOrder');
var mockedinsertPropertyOption = jest.spyOn(mutator_1.mutator, 'insertPropertyOption');
describe('src/component/kanban/kanban', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card1.id = 'id1';
    card1.fields.properties = { id: 'property_value_id_1' };
    var card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card2.id = 'id2';
    card2.fields.properties = { id: 'property_value_id_1' };
    var card3 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card3.id = 'id3';
    card3.fields.properties = { id: 'property_value_id_2' };
    activeView.fields.kanbanCalculations = {
        id1: {
            calculation: 'countEmpty',
            propertyId: '1'
        }
    };
    var optionQ1 = {
        color: 'propColorOrange',
        id: 'property_value_id_1',
        value: 'Q1'
    };
    var optionQ2 = {
        color: 'propColorBlue',
        id: 'property_value_id_2',
        value: 'Q2'
    };
    var optionQ3 = {
        color: 'propColorDefault',
        id: 'property_value_id_3',
        value: 'Q3'
    };
    var groupProperty = {
        id: 'id',
        name: 'name',
        type: 'text',
        options: [optionQ1, optionQ2]
    };
    var state = {
        cards: {
            cards: [card1, card2, card3]
        },
        contents: {},
        comments: {
            comments: {}
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeAll(function () {
        console.error = jest.fn();
        (0, testUtils_1.mockDOM)();
    });
    beforeEach(jest.resetAllMocks);
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2, card3]} groupByProperty={groupProperty} visibleGroups={[
                {
                    option: optionQ1,
                    cards: [card1, card2]
                }, {
                    option: optionQ2,
                    cards: [card3]
                }
            ]} hiddenGroups={[
                {
                    option: optionQ3,
                    cards: []
                }
            ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('do not return a kanban with groupByProperty undefined', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={undefined} visibleGroups={[
                {
                    option: optionQ1,
                    cards: [card1, card2]
                }, {
                    option: optionQ2,
                    cards: [card3]
                }
            ]} hiddenGroups={[
                {
                    option: optionQ3,
                    cards: []
                }
            ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
        expect(mockedUtils.assertFailure).toBeCalled();
        expect(container).toMatchSnapshot();
    });
    test('return kanban and drag card to other card ', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, cardsElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                            {
                                option: optionQ1,
                                cards: [card1, card2]
                            }, {
                                option: optionQ2,
                                cards: [card3]
                            }
                        ]} hiddenGroups={[
                            {
                                option: optionQ3,
                                cards: []
                            }
                        ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
                    cardsElement = container.querySelectorAll('.KanbanCard');
                    expect(cardsElement).not.toBeNull();
                    expect(cardsElement).toHaveLength(3);
                    react_1.fireEvent.dragStart(cardsElement[0]);
                    react_1.fireEvent.dragEnter(cardsElement[1]);
                    react_1.fireEvent.dragOver(cardsElement[1]);
                    react_1.fireEvent.drop(cardsElement[1]);
                    expect(mockedUtils.log).toBeCalled();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                expect(mockedChangeViewCardOrder).toBeCalled();
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return kanban and change card column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, cardsElement, columnQ2Element;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                            {
                                option: optionQ1,
                                cards: [card1, card2]
                            }, {
                                option: optionQ2,
                                cards: [card3]
                            }
                        ]} hiddenGroups={[
                            {
                                option: optionQ3,
                                cards: []
                            }
                        ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
                    cardsElement = container.querySelectorAll('.KanbanCard');
                    expect(cardsElement).not.toBeNull();
                    expect(cardsElement).toHaveLength(3);
                    columnQ2Element = container.querySelector('.octo-board-column:nth-child(2)');
                    expect(columnQ2Element).toBeDefined();
                    react_1.fireEvent.dragStart(cardsElement[0]);
                    react_1.fireEvent.dragEnter(columnQ2Element);
                    react_1.fireEvent.dragOver(columnQ2Element);
                    react_1.fireEvent.drop(columnQ2Element);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                expect(mockedChangeViewCardOrder).toBeCalled();
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return kanban and change card column to hidden column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, cardsElement, columnQ3Element;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                            {
                                option: optionQ1,
                                cards: [card1, card2]
                            }, {
                                option: optionQ2,
                                cards: [card3]
                            }
                        ]} hiddenGroups={[
                            {
                                option: optionQ3,
                                cards: []
                            }
                        ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
                    cardsElement = container.querySelectorAll('.KanbanCard');
                    expect(cardsElement).not.toBeNull();
                    expect(cardsElement).toHaveLength(3);
                    columnQ3Element = container.querySelector('.octo-board-hidden-item');
                    expect(columnQ3Element).toBeDefined();
                    react_1.fireEvent.dragStart(cardsElement[0]);
                    react_1.fireEvent.dragEnter(columnQ3Element);
                    react_1.fireEvent.dragOver(columnQ3Element);
                    react_1.fireEvent.drop(columnQ3Element);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                expect(mockedChangeViewCardOrder).toBeCalled();
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('return kanban and click on New', function () {
        var mockedAddCard = jest.fn();
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                {
                    option: optionQ1,
                    cards: [card1, card2]
                }, {
                    option: optionQ2,
                    cards: [card3]
                }
            ]} hiddenGroups={[
                {
                    option: optionQ3,
                    cards: []
                }
            ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={mockedAddCard} showCard={jest.fn()}/>
      </react_redux_1.Provider>));
        var allButtonsNew = react_1.screen.getAllByRole('button', { name: '+ New' });
        expect(allButtonsNew).not.toBeNull();
        user_event_1["default"].click(allButtonsNew[0]);
        expect(mockedAddCard).toBeCalledTimes(1);
    });
    test('return kanban and click on KanbanCalculationMenu', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                {
                    option: optionQ1,
                    cards: [card1, card2]
                }, {
                    option: optionQ2,
                    cards: [card3]
                }
            ]} hiddenGroups={[
                {
                    option: optionQ3,
                    cards: []
                }
            ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
        var buttonKanbanCalculation = react_1.screen.getByRole('button', { name: '2' });
        expect(buttonKanbanCalculation).toBeDefined();
        user_event_1["default"].click(buttonKanbanCalculation);
        expect(container).toMatchSnapshot();
    });
    test('return kanban and change title on KanbanColumnHeader', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, inputTitle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                            {
                                option: optionQ1,
                                cards: [card1, card2]
                            }, {
                                option: optionQ2,
                                cards: [card3]
                            }
                        ]} hiddenGroups={[
                            {
                                option: optionQ3,
                                cards: []
                            }
                        ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>)).container;
                    inputTitle = react_1.screen.getByRole('textbox', { name: optionQ1.value });
                    expect(inputTitle).toBeDefined();
                    react_1.fireEvent.change(inputTitle, { target: { value: '' } });
                    user_event_1["default"].type(inputTitle, 'New Q1');
                    react_1.fireEvent.blur(inputTitle);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                expect(mockedchangePropertyOptionValue).toBeCalledWith(board, groupProperty, optionQ1, 'New Q1');
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
    test('return kanban and add a group', function () { return __awaiter(void 0, void 0, void 0, function () {
        var buttonAddGroup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanban_1["default"] board={board} activeView={activeView} cards={[card1, card2]} groupByProperty={groupProperty} visibleGroups={[
                            {
                                option: optionQ1,
                                cards: [card1, card2]
                            }, {
                                option: optionQ2,
                                cards: [card3]
                            }
                        ]} hiddenGroups={[
                            {
                                option: optionQ3,
                                cards: []
                            }
                        ]} selectedCardIds={[]} readonly={false} onCardClicked={jest.fn()} addCard={jest.fn()} showCard={jest.fn()}/>
      </react_redux_1.Provider>));
                    buttonAddGroup = react_1.screen.getByRole('button', { name: '+ Add a group' });
                    expect(buttonAddGroup).toBeDefined();
                    user_event_1["default"].click(buttonAddGroup);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockedinsertPropertyOption).toBeCalled();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
