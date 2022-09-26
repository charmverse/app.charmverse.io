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
require("isomorphic-fetch");
var test_utils_1 = require("react-dom/test-utils");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var tableGroupHeaderRow_1 = require("./tableGroupHeaderRow");
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var view2 = testBlockFactory_1.TestBlockFactory.createBoardView(board);
view2.fields.sortOptions = [];
var boardTreeNoGroup = {
    option: {
        id: '',
        value: '',
        color: 'propColorTurquoise'
    },
    cards: []
};
var boardTreeGroup = {
    option: {
        id: 'value1',
        value: 'value 1',
        color: 'propColorTurquoise'
    },
    cards: []
};
test('should match snapshot, no groups', function () { return __awaiter(void 0, void 0, void 0, function () {
    var component, container;
    return __generator(this, function (_a) {
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={view} group={boardTreeNoGroup} readonly={false} hideGroup={jest.fn()} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDrop={jest.fn()} groupByProperty={{
                id: '',
                name: 'Property 1',
                type: 'text',
                options: [{ id: 'property1', value: 'Property 1', color: '' }]
            }}/>);
        container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
test('should match snapshot with Group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var component, container;
    return __generator(this, function (_a) {
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={view} group={boardTreeGroup} readonly={false} hideGroup={jest.fn()} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDrop={jest.fn()}/>);
        container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
test('should match snapshot on read only', function () { return __awaiter(void 0, void 0, void 0, function () {
    var component, container;
    return __generator(this, function (_a) {
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={view} group={boardTreeGroup} readonly={true} hideGroup={jest.fn()} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDrop={jest.fn()}/>);
        container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
test('should match snapshot, hide group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var hideGroup, collapsedOptionsView, component, container, triangle;
    return __generator(this, function (_a) {
        hideGroup = jest.fn();
        collapsedOptionsView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
        collapsedOptionsView.fields.collapsedOptionIds = [boardTreeGroup.option.id];
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={collapsedOptionsView} group={boardTreeGroup} readonly={false} hideGroup={hideGroup} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDrop={jest.fn()}/>);
        container = (0, react_2.render)(component).container;
        triangle = container.querySelector('svg.DisclosureTriangleIcon');
        expect(triangle).not.toBeNull();
        (0, test_utils_1.act)(function () {
            react_2.fireEvent.click(triangle);
        });
        expect(hideGroup).toBeCalled();
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
test('should match snapshot, add new', function () { return __awaiter(void 0, void 0, void 0, function () {
    var addNew, component, container, triangle;
    return __generator(this, function (_a) {
        addNew = jest.fn();
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={view} group={boardTreeGroup} readonly={false} hideGroup={jest.fn()} addCard={addNew} propertyNameChanged={jest.fn()} onDrop={jest.fn()}/>);
        container = (0, react_2.render)(component).container;
        triangle = container.querySelector('i.AddIcon');
        expect(triangle).not.toBeNull();
        (0, test_utils_1.act)(function () {
            react_2.fireEvent.click(triangle);
        });
        expect(addNew).toBeCalled();
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
test('should match snapshot, edit title', function () { return __awaiter(void 0, void 0, void 0, function () {
    var component, _a, container, getByTitle, input;
    return __generator(this, function (_b) {
        component = (0, testUtils_1.wrapDNDIntl)(<tableGroupHeaderRow_1["default"] board={board} activeView={view} group={boardTreeGroup} readonly={false} hideGroup={jest.fn()} addCard={jest.fn()} propertyNameChanged={jest.fn()} onDrop={jest.fn()}/>);
        _a = (0, react_2.render)(component), container = _a.container, getByTitle = _a.getByTitle;
        input = getByTitle(/value 1/);
        (0, test_utils_1.act)(function () {
            user_event_1["default"].click(input);
            user_event_1["default"].keyboard('{enter}');
        });
        expect(container).toMatchSnapshot();
        return [2 /*return*/];
    });
}); });
