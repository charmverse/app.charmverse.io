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
require("@testing-library/jest-dom");
var testUtils_1 = require("../testUtils");
var propertyMenu_1 = require("./propertyMenu");
describe('widgets/PropertyMenu', function () {
    beforeEach(function () {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn();
        document.execCommand = jest.fn();
    });
    test('should display the type of property', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<propertyMenu_1["default"] propertyId='id' propertyName='email of a person' propertyType='email' onTypeAndNameChanged={callback} onDelete={callback}/>);
        var getByText = (0, react_2.render)(component).getByText;
        expect(getByText('Type: Email')).toBeVisible();
    });
    test('handles delete event', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<propertyMenu_1["default"] propertyId='id' propertyName='email of a person' propertyType='email' onTypeAndNameChanged={callback} onDelete={callback}/>);
        var getByText = (0, react_2.render)(component).getByText;
        react_2.fireEvent.click(getByText(/delete/i));
        expect(callback).toHaveBeenCalledWith('id');
    });
    test('handles name change event', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<propertyMenu_1["default"] propertyId='id' propertyName='test-property' propertyType='text' onTypeAndNameChanged={callback} onDelete={callback}/>);
        var getByDisplayValue = (0, react_2.render)(component).getByDisplayValue;
        var input = getByDisplayValue(/test-property/i);
        react_2.fireEvent.change(input, { target: { value: 'changed name' } });
        react_2.fireEvent.blur(input);
        expect(callback).toHaveBeenCalledWith('text', 'changed name');
    });
    test('handles type change event', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callback, component, getByText, menuOpen;
        return __generator(this, function (_a) {
            callback = jest.fn();
            component = (0, testUtils_1.wrapIntl)(<propertyMenu_1["default"] propertyId='id' propertyName='test-property' propertyType='text' onTypeAndNameChanged={callback} onDelete={callback}/>);
            getByText = (0, react_2.render)(component).getByText;
            menuOpen = getByText(/Type: Text/i);
            react_2.fireEvent.click(menuOpen);
            react_2.fireEvent.click(getByText('Select'));
            setTimeout(function () { return expect(callback).toHaveBeenCalledWith('select', 'test-property'); }, 2000);
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot', function () {
        var callback = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<propertyMenu_1["default"] propertyId='id' propertyName='test-property' propertyType='text' onTypeAndNameChanged={callback} onDelete={callback}/>);
        var _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText;
        var menuOpen = getByText(/Type: Text/i);
        react_2.fireEvent.click(menuOpen);
        expect(container).toMatchSnapshot();
    });
});
