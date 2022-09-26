"use strict";
exports.__esModule = true;
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_intl_1 = require("react-intl");
var mutator_1 = require("../../mutator");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var kanbanHiddenColumnItem_1 = require("./kanbanHiddenColumnItem");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('src/components/kanban/kanbanHiddenColumnItem', function () {
    var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var option = {
        id: 'id1',
        value: 'propOption',
        color: 'propColorDefault'
    };
    beforeAll(function () {
        console.error = jest.fn();
    });
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanHiddenColumnItem_1["default"] activeView={activeView} group={{
                option: option,
                cards: [card]
            }} readonly={false} onDrop={jest.fn()} intl={intl}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot readonly', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanHiddenColumnItem_1["default"] activeView={activeView} group={{
                option: option,
                cards: [card]
            }} readonly={true} onDrop={jest.fn()} intl={intl}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return kanbanHiddenColumnItem and click menuwrapper', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanHiddenColumnItem_1["default"] activeView={activeView} group={{
                option: option,
                cards: [card]
            }} readonly={false} onDrop={jest.fn()} intl={intl}/>)).container;
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).not.toBeNull();
        user_event_1["default"].click(buttonMenuWrapper);
        expect(container).toMatchSnapshot();
    });
    test('return kanbanHiddenColumnItem, click menuwrapper and click show', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanHiddenColumnItem_1["default"] activeView={activeView} group={{
                option: option,
                cards: [card]
            }} readonly={false} onDrop={jest.fn()} intl={intl}/>)).container;
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).not.toBeNull();
        user_event_1["default"].click(buttonMenuWrapper);
        expect(container).toMatchSnapshot();
        var buttonShow = (0, react_1.within)(buttonMenuWrapper).getByRole('button', { name: 'Show' });
        user_event_1["default"].click(buttonShow);
        expect(mockedMutator.unhideViewColumn).toBeCalledWith(activeView, option.id);
    });
});
