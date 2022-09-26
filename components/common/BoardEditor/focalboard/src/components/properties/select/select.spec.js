"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../../testUtils");
var select_1 = require("./select");
function selectPropertyTemplate() {
    return {
        id: 'select-template',
        name: 'select',
        type: 'select',
        options: [
            {
                id: 'option-1',
                value: 'one',
                color: 'propColorDefault'
            },
            {
                id: 'option-2',
                value: 'two',
                color: 'propColorTeal'
            },
            {
                id: 'option-3',
                value: 'three',
                color: 'propColorRed'
            }
        ]
    };
}
function selectCallbacks() {
    return {
        onCreate: jest.fn(),
        onChange: jest.fn(),
        onChangeColor: jest.fn(),
        onDeleteOption: jest.fn(),
        onDeleteValue: jest.fn()
    };
}
describe('components/properties/select', function () {
    var nonEditableSelectTestId = 'select-non-editable';
    var clearButton = function () { return react_2.screen.queryByRole('button', { name: /clear/i }); };
    it('shows the selected option', function () {
        var propertyTemplate = selectPropertyTemplate();
        var option = propertyTemplate.options[0];
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue='' propertyTemplate={propertyTemplate} propertyValue={option.id} isEditable={false} {...selectCallbacks()}/>)).container;
        expect(react_2.screen.getByText(option.value)).toBeInTheDocument();
        expect(clearButton()).not.toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });
    it('shows empty placeholder', function () {
        var propertyTemplate = selectPropertyTemplate();
        var emptyValue = 'Empty';
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue={emptyValue} propertyTemplate={propertyTemplate} propertyValue='' isEditable={false} {...selectCallbacks()}/>)).container;
        expect(react_2.screen.getByText(emptyValue)).toBeInTheDocument();
        expect(clearButton()).not.toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });
    it('shows the menu with options when preview is clicked', function () {
        var propertyTemplate = selectPropertyTemplate();
        var selected = propertyTemplate.options[1];
        (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue='' propertyTemplate={propertyTemplate} propertyValue={selected.id} isEditable={true} {...selectCallbacks()}/>));
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableSelectTestId));
        // check that all options are visible
        for (var _i = 0, _a = propertyTemplate.options; _i < _a.length; _i++) {
            var option = _a[_i];
            var elements = react_2.screen.getAllByText(option.value);
            // selected option is rendered twice: in the input and inside the menu
            var expected = option.id === selected.id ? 2 : 1;
            expect(elements.length).toBe(expected);
        }
        expect(clearButton()).toBeInTheDocument();
    });
    it('can select the option from menu', function () {
        var propertyTemplate = selectPropertyTemplate();
        var optionToSelect = propertyTemplate.options[2];
        var onChange = jest.fn();
        (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue='Empty' propertyTemplate={propertyTemplate} propertyValue='' isEditable={true} {...selectCallbacks()} onChange={onChange}/>));
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableSelectTestId));
        user_event_1["default"].click(react_2.screen.getByText(optionToSelect.value));
        expect(clearButton()).not.toBeInTheDocument();
        expect(onChange).toHaveBeenCalledWith(optionToSelect.id);
    });
    it('can clear the selected option', function () {
        var propertyTemplate = selectPropertyTemplate();
        var selected = propertyTemplate.options[1];
        var onDeleteValue = jest.fn();
        (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue='Empty' propertyTemplate={propertyTemplate} propertyValue={selected.id} isEditable={true} {...selectCallbacks()} onDeleteValue={onDeleteValue}/>));
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableSelectTestId));
        var clear = clearButton();
        expect(clear).toBeInTheDocument();
        user_event_1["default"].click(clear);
        expect(onDeleteValue).toHaveBeenCalled();
    });
    it('can create new option', function () {
        var propertyTemplate = selectPropertyTemplate();
        var initialOption = propertyTemplate.options[0];
        var newOption = 'new-option';
        var onCreate = jest.fn();
        (0, react_2.render)((0, testUtils_1.wrapIntl)(<select_1["default"] emptyValue='Empty' propertyTemplate={propertyTemplate} propertyValue={initialOption.id} isEditable={true} {...selectCallbacks()} onCreate={onCreate}/>));
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableSelectTestId));
        user_event_1["default"].type(react_2.screen.getByRole('textbox', { name: /value selector/i }), "".concat(newOption, "{enter}"));
        expect(onCreate).toHaveBeenCalledWith(newOption);
    });
});
