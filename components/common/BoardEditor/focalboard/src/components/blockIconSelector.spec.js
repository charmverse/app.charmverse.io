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
var mutator_1 = require("../mutator");
var testUtils_1 = require("../testUtils");
var testBlockFactory_1 = require("../test/testBlockFactory");
var blockIconSelector_1 = require("./blockIconSelector");
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var icon = '👍';
jest.mock('../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('components/blockIconSelector', function () {
    beforeEach(function () {
        board.fields.icon = icon;
        jest.clearAllMocks();
    });
    test('return an icon correctly', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return no element with no icon', function () {
        board.fields.icon = '';
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return menu on click', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>)).container;
        user_event_1["default"].click(react_2.screen.getByRole('button', { name: 'menuwrapper' }));
        expect(container).toMatchSnapshot();
    });
    test('return no menu in readonly', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} readonly={true}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return a new icon after click on random menu', function () {
        (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>));
        user_event_1["default"].click(react_2.screen.getByRole('button', { name: 'menuwrapper' }));
        var buttonRandom = react_2.screen.queryByRole('button', { name: 'Random' });
        expect(buttonRandom).not.toBeNull();
        user_event_1["default"].click(buttonRandom);
        expect(mockedMutator.changeIcon).toBeCalledTimes(1);
    });
    test('return a new icon after click on EmojiPicker', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, menuPicker, allButtonThumbUp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>)).container;
                    user_event_1["default"].click(react_2.screen.getByRole('button', { name: 'menuwrapper' }));
                    menuPicker = container.querySelector('div#pick');
                    expect(menuPicker).not.toBeNull();
                    react_2.fireEvent.mouseEnter(menuPicker);
                    return [4 /*yield*/, react_2.screen.findAllByRole('button', { name: /thumbsup/i })];
                case 1:
                    allButtonThumbUp = _a.sent();
                    user_event_1["default"].click(allButtonThumbUp[0]);
                    expect(mockedMutator.changeIcon).toBeCalledTimes(1);
                    expect(mockedMutator.changeIcon).toBeCalledWith(board.id, board.fields.icon, '👍');
                    return [2 /*return*/];
            }
        });
    }); });
    test('return no icon after click on remove menu', function () {
        var _a = (0, react_2.render)((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board} size='l'/>)), container = _a.container, rerender = _a.rerender;
        user_event_1["default"].click(react_2.screen.getByRole('button', { name: 'menuwrapper' }));
        var buttonRemove = react_2.screen.queryByRole('button', { name: 'Remove icon' });
        expect(buttonRemove).not.toBeNull();
        user_event_1["default"].click(buttonRemove);
        expect(mockedMutator.changeIcon).toBeCalledTimes(1);
        expect(mockedMutator.changeIcon).toBeCalledWith(board.id, board.fields.icon, '', 'remove icon');
        // simulate reset icon
        board.fields.icon = '';
        rerender((0, testUtils_1.wrapIntl)(<blockIconSelector_1["default"] block={board}/>));
        expect(container).toMatchSnapshot();
    });
});
