"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var mutator_1 = require("../../mutator");
var emptyCardButton_1 = require("./emptyCardButton");
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('components/viewHeader/emptyCardButton', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
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
    test('return EmptyCardButton', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <emptyCardButton_1["default"] addCard={mockFunction}/>
        </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return EmptyCardButton and addCard', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <emptyCardButton_1["default"] addCard={mockFunction}/>
        </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
        var buttonEmpty = react_1.screen.getByRole('button', { name: 'Empty card' });
        user_event_1["default"].click(buttonEmpty);
        expect(mockFunction).toBeCalledTimes(1);
    });
    test('return EmptyCardButton and Set Template', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <emptyCardButton_1["default"] addCard={mockFunction}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonDefault = react_1.screen.getByRole('button', { name: 'Set as default' });
        user_event_1["default"].click(buttonDefault);
        expect(mockedMutator.clearDefaultTemplate).toBeCalledTimes(1);
    });
});
