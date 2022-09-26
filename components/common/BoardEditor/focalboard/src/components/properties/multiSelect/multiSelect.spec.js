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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
require("@testing-library/jest-dom");
var react_intl_1 = require("react-intl");
var multiSelect_1 = require("./multiSelect");
function buildMultiSelectPropertyTemplate(options) {
    if (options === void 0) { options = []; }
    return {
        id: 'multiselect-template-1',
        name: 'Multi',
        options: __spreadArray([
            {
                color: 'propColorDefault',
                id: 'multi-option-1',
                value: 'a'
            },
            {
                color: '',
                id: 'multi-option-2',
                value: 'b'
            },
            {
                color: 'propColorDefault',
                id: 'multi-option-3',
                value: 'c'
            }
        ], options, true),
        type: 'multiSelect'
    };
}
function Wrapper(_a) {
    var children = _a.children;
    return <react_intl_1.IntlProvider locale='en'>{children}</react_intl_1.IntlProvider>;
}
describe('components/properties/multiSelect', function () {
    var nonEditableMultiSelectTestId = 'multiselect-non-editable';
    it('shows only the selected options when menu is not opened', function () {
        var propertyTemplate = buildMultiSelectPropertyTemplate();
        var propertyValue = ['multi-option-1', 'multi-option-2'];
        var container = (0, react_2.render)(<multiSelect_1["default"] isEditable={false} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={jest.fn()} onChangeColor={jest.fn()} onDeleteOption={jest.fn()} onCreate={jest.fn()} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper }).container;
        var multiSelectParent = react_2.screen.getByTestId(nonEditableMultiSelectTestId);
        expect(multiSelectParent.children.length).toBe(propertyValue.length);
        expect(container).toMatchSnapshot();
    });
    it('opens editable multi value selector menu when the button/label is clicked', function () {
        var propertyTemplate = buildMultiSelectPropertyTemplate();
        (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={[]} onChange={jest.fn()} onChangeColor={jest.fn()} onDeleteOption={jest.fn()} onCreate={jest.fn()} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper });
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
        expect(react_2.screen.getByRole('textbox', { name: /value selector/i })).toBeInTheDocument();
    });
    it('can select a option', function () { return __awaiter(void 0, void 0, void 0, function () {
        var propertyTemplate, propertyValue, onChange;
        return __generator(this, function (_a) {
            propertyTemplate = buildMultiSelectPropertyTemplate();
            propertyValue = ['multi-option-1'];
            onChange = jest.fn();
            (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={onChange} onChangeColor={jest.fn()} onDeleteOption={jest.fn()} onCreate={jest.fn()} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper });
            user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
            user_event_1["default"].type(react_2.screen.getByRole('textbox', { name: /value selector/i }), 'b{enter}');
            expect(onChange).toHaveBeenCalledWith(['multi-option-1', 'multi-option-2']);
            return [2 /*return*/];
        });
    }); });
    it('can unselect a option', function () { return __awaiter(void 0, void 0, void 0, function () {
        var propertyTemplate, propertyValue, onDeleteValue, valueToRemove, selectedValues;
        return __generator(this, function (_a) {
            propertyTemplate = buildMultiSelectPropertyTemplate();
            propertyValue = ['multi-option-1'];
            onDeleteValue = jest.fn();
            (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={jest.fn()} onChangeColor={jest.fn()} onDeleteOption={jest.fn()} onCreate={jest.fn()} onDeleteValue={onDeleteValue}/>, { wrapper: Wrapper });
            user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
            user_event_1["default"].click(react_2.screen.getAllByRole('button', { name: /clear/i })[0]);
            valueToRemove = propertyTemplate.options.find(function (option) { return option.id === propertyValue[0]; });
            selectedValues = propertyTemplate.options.filter(function (option) { return propertyValue.includes(option.id); });
            expect(onDeleteValue).toHaveBeenCalledWith(valueToRemove, selectedValues);
            return [2 /*return*/];
        });
    }); });
    it('can create a new option', function () { return __awaiter(void 0, void 0, void 0, function () {
        var propertyTemplate, propertyValue, onCreate, selectedValues;
        return __generator(this, function (_a) {
            propertyTemplate = buildMultiSelectPropertyTemplate();
            propertyValue = ['multi-option-1', 'multi-option-2'];
            onCreate = jest.fn();
            (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={jest.fn()} onChangeColor={jest.fn()} onDeleteOption={jest.fn()} onCreate={onCreate} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper });
            user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
            user_event_1["default"].type(react_2.screen.getByRole('textbox', { name: /value selector/i }), 'new-value{enter}');
            selectedValues = propertyTemplate.options.filter(function (option) { return propertyValue.includes(option.id); });
            expect(onCreate).toHaveBeenCalledWith('new-value', selectedValues);
            return [2 /*return*/];
        });
    }); });
    it('can delete a option', function () {
        var propertyTemplate = buildMultiSelectPropertyTemplate();
        var propertyValue = ['multi-option-1', 'multi-option-2'];
        var onDeleteOption = jest.fn();
        (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={jest.fn()} onChangeColor={jest.fn()} onDeleteOption={onDeleteOption} onCreate={jest.fn()} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper });
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
        user_event_1["default"].click(react_2.screen.getAllByRole('button', { name: /open menu/i })[0]);
        user_event_1["default"].click(react_2.screen.getByRole('button', { name: /delete/i }));
        var optionToDelete = propertyTemplate.options.find(function (option) { return option.id === propertyValue[0]; });
        expect(onDeleteOption).toHaveBeenCalledWith(optionToDelete);
    });
    it('can change color for any option', function () {
        var propertyTemplate = buildMultiSelectPropertyTemplate();
        var propertyValue = ['multi-option-1', 'multi-option-2'];
        var newColorKey = 'propColorYellow';
        var newColorValue = 'yellow';
        var onChangeColor = jest.fn();
        (0, react_2.render)(<multiSelect_1["default"] isEditable={true} emptyValue='' propertyTemplate={propertyTemplate} propertyValue={propertyValue} onChange={jest.fn()} onChangeColor={onChangeColor} onDeleteOption={jest.fn()} onCreate={jest.fn()} onDeleteValue={jest.fn()}/>, { wrapper: Wrapper });
        user_event_1["default"].click(react_2.screen.getByTestId(nonEditableMultiSelectTestId));
        user_event_1["default"].click(react_2.screen.getAllByRole('button', { name: /open menu/i })[0]);
        user_event_1["default"].click(react_2.screen.getByRole('button', { name: new RegExp(newColorValue, 'i') }));
        var selectedOption = propertyTemplate.options.find(function (option) { return option.id === propertyValue[0]; });
        expect(onChangeColor).toHaveBeenCalledWith(selectedOption, newColorKey);
    });
});
