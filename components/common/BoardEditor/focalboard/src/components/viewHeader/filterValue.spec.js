"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var mutator_1 = require("../../mutator");
var filterValue_1 = require("./filterValue");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
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
var filter = {
    propertyId: '1',
    condition: 'includes',
    values: ['Status']
};
describe('components/viewHeader/filterValue', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        board.fields.cardProperties[0].options = [{ id: 'Status', value: 'Status', color: '' }];
        activeView.fields.filter.filters = [filter];
    });
    test('return filterValue', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterValue_1["default"] view={activeView} filter={filter} template={board.fields.cardProperties[0]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return filterValue and click Status', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterValue_1["default"] view={activeView} filter={filter} template={board.fields.cardProperties[0]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        var switchStatus = react_1.screen.getAllByText('Status')[1];
        user_event_1["default"].click(switchStatus);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
        expect(container).toMatchSnapshot();
    });
    test('return filterValue and click Status with Status not in filter', function () {
        filter.values = ['test'];
        activeView.fields.filter.filters = [filter];
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterValue_1["default"] view={activeView} filter={filter} template={board.fields.cardProperties[0]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        var switchStatus = react_1.screen.getAllByText('Status')[0];
        user_event_1["default"].click(switchStatus);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
        expect(container).toMatchSnapshot();
    });
});
