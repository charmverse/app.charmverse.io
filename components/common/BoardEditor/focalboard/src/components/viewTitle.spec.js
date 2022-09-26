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
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var mutator_1 = require("../mutator");
var utils_1 = require("../utils");
var testBlockFactory_1 = require("../test/testBlockFactory");
var testUtils_1 = require("../testUtils");
var viewTitle_1 = require("./viewTitle");
jest.mock('../mutator');
jest.mock('../utils');
var mockedMutator = jest.mocked(mutator_1["default"], true);
var mockedUtils = jest.mocked(utils_1.Utils, true);
mockedUtils.createGuid.mockReturnValue('test-id');
beforeAll(function () {
    (0, testUtils_1.mockDOM)();
});
describe('components/viewTitle', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.id = 'test-id';
    board.rootId = board.id;
    var state = {
        users: {
            workspaceUsers: {
                1: { username: 'abc' },
                2: { username: 'd' },
                3: { username: 'e' },
                4: { username: 'f' },
                5: { username: 'g' }
            }
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={false} setPage={function () { }}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should match snapshot readonly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={true} setPage={function () { }}/>
        </react_redux_1.Provider>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    test('show description', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, hideDescriptionButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    board.fields.showDescription = true;
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={false} setPage={function () { }}/>
        </react_redux_1.Provider>));
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    hideDescriptionButton = react_1.screen.getAllByRole('button')[0];
                    user_event_1["default"].click(hideDescriptionButton);
                    expect(mockedMutator.showDescription).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('hide description', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, showDescriptionButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    board.fields.showDescription = false;
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={false} setPage={function () { }}/>
        </react_redux_1.Provider>));
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    showDescriptionButton = react_1.screen.getAllByRole('button')[0];
                    user_event_1["default"].click(showDescriptionButton);
                    expect(mockedMutator.showDescription).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('add random icon', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container, randomIconButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    board.fields.icon = '';
                    return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                result = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={false} setPage={function () { }}/>
        </react_redux_1.Provider>));
                                container = result.container;
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    randomIconButton = react_1.screen.getAllByRole('button')[0];
                    user_event_1["default"].click(randomIconButton);
                    expect(mockedMutator.changeIcon).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('change title', function () { return __awaiter(void 0, void 0, void 0, function () {
        var titleInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewTitle_1["default"] board={board} readonly={false} setPage={function () { }}/>
        </react_redux_1.Provider>));
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    titleInput = react_1.screen.getAllByRole('textbox')[0];
                    user_event_1["default"].type(titleInput, 'other title');
                    react_1.fireEvent.blur(titleInput);
                    expect(mockedMutator.changeTitle).toBeCalledTimes(1);
                    return [2 /*return*/];
            }
        });
    }); });
});
