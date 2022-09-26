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
var newCardButtonTemplateItem_1 = require("./newCardButtonTemplateItem");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var card = testBlockFactory_1.TestBlockFactory.createCard(board);
describe('components/viewHeader/newCardButtonTemplateItem', function () {
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
    test('return NewCardButtonTemplateItem', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButtonTemplateItem_1["default"] cardTemplate={card} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return NewCardButtonTemplateItem and edit', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButtonTemplateItem_1["default"] cardTemplate={card} addCardFromTemplate={jest.fn()} editCardTemplate={mockFunction}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonEdit = react_1.screen.getByRole('button', { name: 'Edit' });
        user_event_1["default"].click(buttonEdit);
        expect(mockFunction).toBeCalledTimes(1);
        expect(mockFunction).toBeCalledWith(card.id);
    });
    test('return NewCardButtonTemplateItem and add Card from template', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButtonTemplateItem_1["default"] cardTemplate={card} addCardFromTemplate={mockFunction} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonAdd = react_1.screen.getByRole('button', { name: 'title' });
        user_event_1["default"].click(buttonAdd);
        expect(container).toMatchSnapshot();
        expect(mockFunction).toBeCalledTimes(1);
    });
    test('return NewCardButtonTemplateItem and delete', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButtonTemplateItem_1["default"] cardTemplate={card} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonDelete = react_1.screen.getByRole('button', { name: 'Delete' });
        user_event_1["default"].click(buttonDelete);
        expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
    });
    test('return NewCardButtonTemplateItem and Set as default', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <newCardButtonTemplateItem_1["default"] cardTemplate={card} addCardFromTemplate={jest.fn()} editCardTemplate={jest.fn()}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonSetAsDefault = react_1.screen.getByRole('button', { name: 'Set as default' });
        user_event_1["default"].click(buttonSetAsDefault);
        expect(mockedMutator.setDefaultTemplate).toBeCalledTimes(1);
        expect(mockedMutator.setDefaultTemplate).toBeCalledWith(activeView.id, activeView.fields.defaultTemplateId, card.id);
    });
});
