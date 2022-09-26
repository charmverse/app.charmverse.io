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
var testUtils_1 = require("../../testUtils");
require("isomorphic-fetch");
var constants_1 = require("../../constants");
var mutator_1 = require("../../mutator");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var fetchMock_1 = require("../../test/fetchMock");
var tableHeaderMenu_1 = require("./tableHeaderMenu");
global.fetch = fetchMock_1.FetchMock.fn;
// import mutator from '../../mutator'
jest.mock('../../mutator', function () { return ({
    changeViewSortOptions: jest.fn(),
    insertPropertyTemplate: jest.fn(),
    changeViewVisibleProperties: jest.fn(),
    duplicatePropertyTemplate: jest.fn(),
    deleteProperty: jest.fn()
}); });
beforeEach(function () {
    jest.resetAllMocks();
    fetchMock_1.FetchMock.fn.mockReset();
});
describe('components/table/TableHeaderMenu', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var view2 = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view2.fields.sortOptions = [];
    test('should match snapshot, title column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var component, _a, container, getByText, sort, insert;
        return __generator(this, function (_b) {
            component = (0, testUtils_1.wrapIntl)(<tableHeaderMenu_1["default"] templateId={constants_1.Constants.titleColumnId} board={board} activeView={view} views={[view, view2]} cards={[]}/>);
            _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText;
            sort = getByText(/Sort ascending/i);
            react_2.fireEvent.click(sort);
            sort = getByText(/Sort descending/i);
            react_2.fireEvent.click(sort);
            expect(mutator_1["default"].changeViewSortOptions).toHaveBeenCalledTimes(2);
            insert = getByText(/Insert left/i);
            react_2.fireEvent.click(insert);
            insert = getByText(/Insert right/i);
            react_2.fireEvent.click(insert);
            expect(mutator_1["default"].insertPropertyTemplate).toHaveBeenCalledTimes(0);
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, other column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var component, _a, container, getByText, sort, insert, hide, duplicate, del;
        return __generator(this, function (_b) {
            component = (0, testUtils_1.wrapIntl)(<tableHeaderMenu_1["default"] templateId='property 1' board={board} activeView={view} views={[view, view2]} cards={[]}/>);
            _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText;
            sort = getByText(/Sort ascending/i);
            react_2.fireEvent.click(sort);
            sort = getByText(/Sort descending/i);
            react_2.fireEvent.click(sort);
            expect(mutator_1["default"].changeViewSortOptions).toHaveBeenCalledTimes(2);
            insert = getByText(/Insert left/i);
            react_2.fireEvent.click(insert);
            insert = getByText(/Insert right/i);
            react_2.fireEvent.click(insert);
            expect(mutator_1["default"].insertPropertyTemplate).toHaveBeenCalledTimes(2);
            hide = getByText(/Hide/i);
            react_2.fireEvent.click(hide);
            expect(mutator_1["default"].changeViewVisibleProperties).toHaveBeenCalled();
            duplicate = getByText(/Duplicate/i);
            react_2.fireEvent.click(duplicate);
            expect(mutator_1["default"].duplicatePropertyTemplate).toHaveBeenCalled();
            del = getByText(/Delete/i);
            react_2.fireEvent.click(del);
            expect(mutator_1["default"].deleteProperty).toHaveBeenCalled();
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
});
