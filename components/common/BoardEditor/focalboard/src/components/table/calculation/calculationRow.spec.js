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
var testBlockFactory_1 = require("../../../test/testBlockFactory");
var fetchMock_1 = require("../../../test/fetchMock");
require("isomorphic-fetch");
var testUtils_1 = require("../../../testUtils");
var calculationRow_1 = require("./calculationRow");
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
describe('components/table/calculation/CalculationRow', function () {
    var _a;
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.fields.cardProperties.push({
        id: 'property_2',
        name: 'Property 2',
        type: 'text',
        options: []
    });
    board.fields.cardProperties.push({
        id: 'property_3',
        name: 'Property 3',
        type: 'text',
        options: []
    });
    board.fields.cardProperties.push({
        id: 'property_4',
        name: 'Property 4',
        type: 'text',
        options: []
    });
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    (_a = view.fields.visiblePropertyIds).push.apply(_a, ['property_2', 'property_3', 'property_4']);
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.fields.properties.property_2 = 'Foo';
    card.fields.properties.property_3 = 'Bar';
    card.fields.properties.property_4 = 'Baz';
    var card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card2.fields.properties.property_2 = 'Lorem';
    card2.fields.properties.property_3 = '';
    card2.fields.properties.property_4 = 'Baz';
    test('should render three calculation elements', function () { return __awaiter(void 0, void 0, void 0, function () {
        var component, container;
        return __generator(this, function (_a) {
            fetchMock_1.FetchMock.fn.mockReturnValueOnce(fetchMock_1.FetchMock.jsonResponse(JSON.stringify([board, view, card])));
            component = (0, testUtils_1.wrapDNDIntl)(<calculationRow_1["default"] board={board} cards={[card, card2]} activeView={view} resizingColumn='' offset={0} readonly={false}/>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var component, container;
        return __generator(this, function (_a) {
            board.fields.columnCalculations = {
                property_2: 'count',
                property_3: 'countValue',
                property_4: 'countUniqueValue'
            };
            component = (0, testUtils_1.wrapDNDIntl)(<calculationRow_1["default"] board={board} cards={[card, card2]} activeView={view} resizingColumn='' offset={0} readonly={false}/>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
});
