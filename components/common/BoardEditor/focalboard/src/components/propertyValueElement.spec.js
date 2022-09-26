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
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../testUtils");
require("isomorphic-fetch");
var testBlockFactory_1 = require("../test/testBlockFactory");
var propertyValueElement_1 = require("./propertyValueElement");
describe('components/propertyValueElement', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    test('should match snapshot, select', function () { return __awaiter(void 0, void 0, void 0, function () {
        var propertyTemplate, component, container;
        return __generator(this, function (_a) {
            propertyTemplate = board.fields.cardProperties.find(function (p) { return p.id === 'property1'; });
            component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedAt='' updatedBy='' propertyTemplate={propertyTemplate || board.fields.cardProperties[0]} showEmptyPlaceholder={true}/>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, select, read-only', function () { return __awaiter(void 0, void 0, void 0, function () {
        var propertyTemplate, component, container;
        return __generator(this, function (_a) {
            propertyTemplate = board.fields.cardProperties.find(function (p) { return p.id === 'property1'; });
            component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={true} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate || board.fields.cardProperties[0]} showEmptyPlaceholder={true}/>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, multi-select', function () {
        var options = [];
        for (var i = 0; i < 3; i++) {
            var propertyOption = {
                id: "ms".concat(i),
                value: "value ".concat(i),
                color: 'propColorTurquoise'
            };
            options.push(propertyOption);
        }
        var propertyTemplate = {
            id: 'multiSelect',
            name: 'MultiSelect',
            type: 'multiSelect',
            options: options
        };
        card.fields.properties.multiSelect = ['ms1', 'ms2'];
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot, url, array value', function () {
        var propertyTemplate = {
            id: 'property_url',
            name: 'Property URL',
            type: 'url',
            options: []
        };
        card.fields.properties.property_url = ['http://localhost'];
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot, url, array value', function () {
        var propertyTemplate = {
            id: 'property_url',
            name: 'Property URL',
            type: 'url',
            options: []
        };
        card.fields.properties.property_url = ['http://localhost'];
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot, person, array value', function () {
        var propertyTemplate = {
            id: 'text',
            name: 'Generic Text',
            type: 'text',
            options: []
        };
        card.fields.properties.person = ['value1', 'value2'];
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot, date, array value', function () {
        var propertyTemplate = {
            id: 'date',
            name: 'Date',
            type: 'date',
            options: []
        };
        card.fields.properties.date = ['invalid date'];
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('URL fields should allow cancel', function () {
        var propertyTemplate = {
            id: 'property_url',
            name: 'Property URL',
            type: 'url',
            options: []
        };
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        var editElement = container.querySelector('.Editable');
        expect(editElement).toBeDefined();
        user_event_1["default"].type(editElement, 'http://test{esc}');
        expect(container).toMatchSnapshot();
    });
    test('Generic fields should allow cancel', function () {
        var propertyTemplate = {
            id: 'text',
            name: 'Generic Text',
            type: 'text',
            options: []
        };
        var component = (0, testUtils_1.wrapDNDIntl)(<propertyValueElement_1["default"] board={board} readOnly={false} card={card} updatedBy='' updatedAt='' propertyTemplate={propertyTemplate} showEmptyPlaceholder={true}/>);
        var container = (0, react_2.render)(component).container;
        var editElement = container.querySelector('.Editable');
        expect(editElement).toBeDefined();
        user_event_1["default"].type(editElement, 'http://test{esc}');
        expect(container).toMatchSnapshot();
    });
});
