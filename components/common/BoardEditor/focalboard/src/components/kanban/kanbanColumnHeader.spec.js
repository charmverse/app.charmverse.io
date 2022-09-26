"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_intl_1 = require("react-intl");
var mutator_1 = require("../../mutator");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var kanbanColumnHeader_1 = require("./kanbanColumnHeader");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('src/components/kanban/kanbanColumnHeader', function () {
    var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.id = 'id1';
    activeView.fields.kanbanCalculations = {
        id1: {
            calculation: 'countEmpty',
            propertyId: '1'
        }
    };
    var option = {
        id: 'id1',
        value: 'Title',
        color: 'propColorDefault'
    };
    beforeAll(function () {
        console.error = jest.fn();
    });
    beforeEach(jest.resetAllMocks);
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot readonly', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={true} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return kanbanColumnHeader and edit title', function () {
        var mockedPropertyNameChanged = jest.fn();
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={mockedPropertyNameChanged} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>)).container;
        var inputTitle = react_1.screen.getByRole('textbox', { name: option.value });
        expect(inputTitle).toBeDefined();
        react_1.fireEvent.change(inputTitle, { target: { value: '' } });
        user_event_1["default"].type(inputTitle, 'New Title');
        react_1.fireEvent.blur(inputTitle);
        expect(mockedPropertyNameChanged).toBeCalledWith(option, 'New Title');
        expect(container).toMatchSnapshot();
    });
    test('return kanbanColumnHeader and click on menuwrapper', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>)).container;
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).toBeDefined();
        user_event_1["default"].click(buttonMenuWrapper);
        expect(container).toMatchSnapshot();
    });
    test('return kanbanColumnHeader, click on menuwrapper and click on hide menu', function () {
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>));
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).toBeDefined();
        user_event_1["default"].click(buttonMenuWrapper);
        var buttonHide = (0, react_1.within)(buttonMenuWrapper).getByRole('button', { name: 'Hide' });
        expect(buttonHide).toBeDefined();
        user_event_1["default"].click(buttonHide);
        expect(mockedMutator.hideViewColumn).toBeCalledTimes(1);
    });
    test('return kanbanColumnHeader, click on menuwrapper and click on delete menu', function () {
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>));
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).toBeDefined();
        user_event_1["default"].click(buttonMenuWrapper);
        var buttonDelete = (0, react_1.within)(buttonMenuWrapper).getByRole('button', { name: 'Delete' });
        expect(buttonDelete).toBeDefined();
        user_event_1["default"].click(buttonDelete);
        expect(mockedMutator.deletePropertyOption).toBeCalledTimes(1);
    });
    test('return kanbanColumnHeader, click on menuwrapper and click on blue color menu', function () {
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>));
        var buttonMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(buttonMenuWrapper).toBeDefined();
        user_event_1["default"].click(buttonMenuWrapper);
        var buttonBlueColor = (0, react_1.within)(buttonMenuWrapper).getByRole('button', { name: 'Select Blue Color' });
        expect(buttonBlueColor).toBeDefined();
        user_event_1["default"].click(buttonBlueColor);
        expect(mockedMutator.changePropertyOptionColor).toBeCalledTimes(1);
    });
    test('return kanbanColumnHeader and click to add card', function () {
        var _a;
        var mockedAddCard = jest.fn();
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={mockedAddCard} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>)).container;
        var buttonAddCard = (_a = container.querySelector('.AddIcon')) === null || _a === void 0 ? void 0 : _a.parentElement;
        expect(buttonAddCard).toBeDefined();
        user_event_1["default"].click(buttonAddCard);
        expect(mockedAddCard).toBeCalledTimes(1);
    });
    test('return kanbanColumnHeader and click KanbanCalculationMenu', function () {
        var mockedCalculationMenuOpen = jest.fn();
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={false} onCalculationMenuOpen={mockedCalculationMenuOpen} onCalculationMenuClose={jest.fn()}/>));
        var buttonKanbanCalculation = react_1.screen.getByText(/0/i).parentElement;
        expect(buttonKanbanCalculation).toBeDefined();
        user_event_1["default"].click(buttonKanbanCalculation);
        expect(mockedCalculationMenuOpen).toBeCalledTimes(1);
    });
    test('return kanbanColumnHeader and click count on KanbanCalculationMenu', function () {
        (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<kanbanColumnHeader_1["default"] board={board} activeView={activeView} group={{
                option: option,
                cards: [card]
            }} intl={intl} readonly={false} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDropToColumn={jest.fn()} calculationMenuOpen={true} onCalculationMenuOpen={jest.fn()} onCalculationMenuClose={jest.fn()}/>));
        var menuCountEmpty = react_1.screen.getByText('Count');
        expect(menuCountEmpty).toBeDefined();
        user_event_1["default"].click(menuCountEmpty);
        expect(mockedMutator.changeViewKanbanCalculations).toBeCalledTimes(1);
    });
});
