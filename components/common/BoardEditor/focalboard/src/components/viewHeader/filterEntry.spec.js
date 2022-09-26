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
var filterEntry_1 = require("./filterEntry");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var filter = {
    propertyId: '1',
    condition: 'includes',
    values: ['Status']
};
var state = {
    users: {
        me: {
            id: 'user-id-1',
            username: 'username_1'
        }
    }
};
var store = (0, testUtils_1.mockStateStore)([], state);
var mockedConditionClicked = jest.fn();
describe('components/viewHeader/filterEntry', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        board.fields.cardProperties[0].options = [{ id: 'Status', value: 'Status', color: '' }];
        activeView.fields.filter.filters = [filter];
    });
    test('return filterEntry', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return filterEntry and click on status', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[0];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonStatus = react_1.screen.getByRole('button', { name: 'Status' });
        user_event_1["default"].click(buttonStatus);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    });
    test('return filterEntry and click on includes', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonIncludes = react_1.screen.getAllByRole('button', { name: 'includes' })[1];
        user_event_1["default"].click(buttonIncludes);
        expect(mockedConditionClicked).toBeCalledTimes(1);
    });
    test('return filterEntry and click on doesn\'t include', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonNotInclude = react_1.screen.getByRole('button', { name: 'doesn\'t include' });
        user_event_1["default"].click(buttonNotInclude);
        expect(mockedConditionClicked).toBeCalledTimes(1);
    });
    test('return filterEntry and click on is empty', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonEmpty = react_1.screen.getByRole('button', { name: 'is empty' });
        user_event_1["default"].click(buttonEmpty);
        expect(mockedConditionClicked).toBeCalledTimes(1);
    });
    test('return filterEntry and click on is not empty', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonNotEmpty = react_1.screen.getByRole('button', { name: 'is not empty' });
        user_event_1["default"].click(buttonNotEmpty);
        expect(mockedConditionClicked).toBeCalledTimes(1);
    });
    test('return filterEntry and click on delete', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <filterEntry_1["default"] board={board} view={activeView} conditionClicked={mockedConditionClicked} filter={filter}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getAllByRole('button', { name: 'menuwrapper' })[1];
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var allButton = react_1.screen.getAllByRole('button');
        user_event_1["default"].click(allButton[allButton.length - 1]);
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    });
});
