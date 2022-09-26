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
var viewHeaderSortMenu_1 = require("./viewHeaderSortMenu");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var cards = [testBlockFactory_1.TestBlockFactory.createCard(board), testBlockFactory_1.TestBlockFactory.createCard(board)];
describe('components/viewHeader/viewHeaderSortMenu', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('return sort menu', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSortMenu_1["default"] activeView={activeView} orderedCards={cards} properties={board.fields.cardProperties}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return sort menu and do manual', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSortMenu_1["default"] activeView={activeView} orderedCards={cards} properties={board.fields.cardProperties}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        var buttonManual = react_1.screen.getByRole('button', { name: 'Manual' });
        user_event_1["default"].click(buttonManual);
        expect(container).toMatchSnapshot();
        expect(mockedMutator.updateBlock).toBeCalledTimes(1);
    });
    test('return sort menu and do revert', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSortMenu_1["default"] activeView={activeView} orderedCards={cards} properties={board.fields.cardProperties}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        var buttonRevert = react_1.screen.getByRole('button', { name: 'Revert' });
        user_event_1["default"].click(buttonRevert);
        expect(container).toMatchSnapshot();
        expect(mockedMutator.changeViewSortOptions).toBeCalledTimes(1);
        expect(mockedMutator.changeViewSortOptions).toBeCalledWith(activeView.id, activeView.fields.sortOptions, []);
    });
    test('return sort menu and do Name sort', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSortMenu_1["default"] activeView={activeView} orderedCards={cards} properties={board.fields.cardProperties}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        var buttonName = react_1.screen.getByRole('button', { name: 'Name' });
        user_event_1["default"].click(buttonName);
        expect(container).toMatchSnapshot();
        expect(mockedMutator.changeViewSortOptions).toBeCalledTimes(1);
        expect(mockedMutator.changeViewSortOptions).toBeCalledWith(activeView.id, activeView.fields.sortOptions, [{ propertyId: '__title', reversed: false }]);
    });
});
