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
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
require("@testing-library/jest-dom");
var react_intl_1 = require("react-intl");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var mutator_1 = require("../../mutator");
var propertyMenu_1 = require("../../widgets/propertyMenu");
var cardDetailProperties_1 = require("./cardDetailProperties");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('components/cardDetail/CardDetailProperties', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.fields.cardProperties = [
        {
            id: 'property_id_1',
            name: 'Owner',
            type: 'select',
            options: [
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_1',
                    value: 'Jean-Luc Picard'
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_2',
                    value: 'William Riker'
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_3',
                    value: 'Deanna Troi'
                }
            ]
        },
        {
            id: 'property_id_2',
            name: 'MockStatus',
            type: 'number',
            options: []
        }
    ];
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view.fields.sortOptions = [];
    view.fields.groupById = undefined;
    view.fields.hiddenOptionIds = [];
    var views = [view];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.fields.properties.property_id_1 = 'property_value_id_1';
    card.fields.properties.property_id_2 = '1234';
    var cardTemplate = testBlockFactory_1.TestBlockFactory.createCard(board);
    cardTemplate.fields.isTemplate = true;
    var cards = [card];
    function renderComponent() {
        var component = (0, testUtils_1.wrapIntl)((<cardDetailProperties_1["default"] board={board} card={card} cards={[card]} pageUpdatedAt='' pageUpdatedBy='' activeView={view} views={views} readonly={false}/>));
        return (0, react_2.render)(component);
    }
    it('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            container = renderComponent().container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    it('should show confirmation dialog when deleting existing select property', function () {
        renderComponent();
        var menuElement = react_2.screen.getByRole('button', { name: 'Owner' });
        user_event_1["default"].click(menuElement);
        var deleteButton = react_2.screen.getByRole('button', { name: /delete/i });
        user_event_1["default"].click(deleteButton);
        expect(react_2.screen.getByRole('heading', { name: 'Confirm Delete Property' })).toBeInTheDocument();
        expect(react_2.screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
    it('should show property types menu', function () {
        var intl = (0, react_intl_1.createIntl)({ locale: 'en' });
        var container = renderComponent().container;
        var menuElement = react_2.screen.getByRole('button', { name: /add a property/i });
        user_event_1["default"].click(menuElement);
        expect(container).toMatchSnapshot();
        var selectProperty = react_2.screen.getByText(/select property type/i);
        expect(selectProperty).toBeInTheDocument();
        propertyMenu_1.propertyTypesList.forEach(function (type) {
            var typeButton = react_2.screen.getByRole('button', { name: (0, propertyMenu_1.typeDisplayName)(intl, type) });
            expect(typeButton).toBeInTheDocument();
        });
    });
    test('rename select property and confirm button on dialog should rename property', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, propertyTemplate, confirmButton;
        return __generator(this, function (_a) {
            result = renderComponent();
            // rename to "Owner-Renamed"
            onPropertyRenameOpenConfirmationDialog(result.container);
            propertyTemplate = board.fields.cardProperties[0];
            confirmButton = result.getByTitle('Change Property');
            expect(confirmButton).toBeDefined();
            user_event_1["default"].click(confirmButton);
            // should be called once on confirming renaming the property
            expect(mockedMutator.changePropertyTypeAndName).toBeCalledTimes(1);
            expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledWith(board, cards, propertyTemplate, 'select', 'Owner - Renamed');
            return [2 /*return*/];
        });
    }); });
    it('should add new number property', function () { return __awaiter(void 0, void 0, void 0, function () {
        var menuElement, args, template;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renderComponent();
                    menuElement = react_2.screen.getByRole('button', { name: /add a property/i });
                    user_event_1["default"].click(menuElement);
                    return [4 /*yield*/, (0, react_2.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var numberType;
                            return __generator(this, function (_a) {
                                numberType = react_2.screen.getByRole('button', { name: /number/i });
                                user_event_1["default"].click(numberType);
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(mockedMutator.insertPropertyTemplate).toHaveBeenCalledTimes(1);
                    args = mockedMutator.insertPropertyTemplate.mock.calls[0];
                    template = args[3];
                    expect(template).toBeTruthy();
                    expect(template.name).toMatch(/number/i);
                    expect(template.type).toBe('number');
                    return [2 /*return*/];
            }
        });
    }); });
    it('cancel button in TypeorNameChange dialog should do nothing', function () {
        var result = renderComponent();
        var container = result.container;
        onPropertyRenameOpenConfirmationDialog(container);
        var cancelButton = result.getByTitle('Cancel');
        expect(cancelButton).toBeDefined();
        user_event_1["default"].click(cancelButton);
        expect(container).toMatchSnapshot();
    });
    it('confirmation on delete dialog should delete the property', function () {
        var result = renderComponent();
        var container = result.container;
        openDeleteConfirmationDialog(container);
        var propertyTemplate = board.fields.cardProperties[0];
        var confirmButton = result.getByTitle('Delete');
        expect(confirmButton).toBeDefined();
        // click delete button
        user_event_1["default"].click(confirmButton);
        // should be called once on confirming delete
        expect(mockedMutator.deleteProperty).toBeCalledTimes(1);
        expect(mockedMutator.deleteProperty).toBeCalledWith(board, views, cards, propertyTemplate.id);
    });
    it('cancel on delete dialog should do nothing', function () {
        var result = renderComponent();
        var container = result.container;
        openDeleteConfirmationDialog(container);
        var cancelButton = result.getByTitle('Cancel');
        expect(cancelButton).toBeDefined();
        user_event_1["default"].click(cancelButton);
        expect(container).toMatchSnapshot();
    });
    function openDeleteConfirmationDialog(container) {
        var propertyLabel = container.querySelector('.MenuWrapper');
        expect(propertyLabel).toBeDefined();
        user_event_1["default"].click(propertyLabel);
        var deleteOption = container.querySelector('.MenuOption.TextOption');
        expect(propertyLabel).toBeDefined();
        user_event_1["default"].click(deleteOption);
        var confirmDialog = container.querySelector('.dialog.confirmation-dialog-box');
        expect(confirmDialog).toBeDefined();
    }
    function onPropertyRenameOpenConfirmationDialog(container) {
        var propertyLabel = container.querySelector('.MenuWrapper');
        expect(propertyLabel).toBeDefined();
        user_event_1["default"].click(propertyLabel);
        // write new name in the name text box
        var propertyNameInput = container.querySelector('.PropertyMenu.menu-textbox');
        expect(propertyNameInput).toBeDefined();
        user_event_1["default"].type(propertyNameInput, 'Owner - Renamed{enter}');
        user_event_1["default"].click(propertyLabel);
        var confirmDialog = container.querySelector('.dialog.confirmation-dialog-box');
        expect(confirmDialog).toBeDefined();
    }
});
