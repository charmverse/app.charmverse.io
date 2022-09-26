"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var newCardButton_1 = require("./newCardButton");
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
describe('components/viewHeader/newCardButton', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
        },
        boards: {
            current: board
        },
        cards: {
            templates: []
        },
        views: {
            current: 0,
            views: [activeView]
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    var mockFunction = jest.fn();
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('return NewCardButton', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButton_1["default"] addCard={jest.fn()} addCardTemplate={jest.fn()} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return NewCardButton and addCard', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButton_1["default"] addCard={mockFunction} addCardTemplate={jest.fn()} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonAdd = react_1.screen.getByRole('button', { name: 'Empty card' });
        user_event_1["default"].click(buttonAdd);
        expect(mockFunction).toBeCalledTimes(1);
    });
    test('return NewCardButton and addCardTemplate', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButton_1["default"] addCard={jest.fn()} addCardTemplate={mockFunction} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonAddTemplate = react_1.screen.getByRole('button', { name: 'New template' });
        user_event_1["default"].click(buttonAddTemplate);
        expect(mockFunction).toBeCalledTimes(1);
    });
});
