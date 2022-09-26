"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var mutator_1 = require("../../mutator");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var filterComponent_1 = require("./filterComponent");
var mockedMutator = jest.mocked(mutator_1["default"], true);
var filter = {
    propertyId: '1',
    condition: 'includes',
    values: ['Status']
};
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var state = {
    users: {
        me: {
            id: 'user-id-1',
            username: 'username_1'
        }
    }
};
var store = (0, testUtils_1.mockStateStore)([], state);
describe('components/viewHeader/filterComponent', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        board.fields.cardProperties[0].options = [{ id: 'Status', value: 'Status', color: '' }];
        activeView.fields.filter.filters = [filter];
    });
    test('return filterComponent', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterComponent_1["default"] board={board} activeView={activeView} onClose={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return filterComponent and add Filter', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterComponent_1["default"] board={board} activeView={activeView} onClose={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonAdd = react_1.screen.getByText('+ Add filter');
        user_event_1["default"].click(buttonAdd);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    });
    test('return filterComponent and filter by status', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterComponent_1["default"] board={board} activeView={activeView} onClose={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonStatus = react_1.screen.getByRole('button', { name: 'Status' });
        user_event_1["default"].click(buttonStatus);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    });
    test('return filterComponent and click is empty', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterComponent_1["default"] board={board} activeView={activeView} onClose={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonNotInclude = react_1.screen.getByRole('button', { name: 'is empty' });
        user_event_1["default"].click(buttonNotInclude);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    });
});
