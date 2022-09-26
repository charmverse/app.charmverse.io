"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testUtils_1 = require("../../testUtils");
var viewHeaderSearch_1 = require("./viewHeaderSearch");
jest.mock('react-router-dom', function () {
    var originalModule = jest.requireActual('react-router-dom');
    return __assign(__assign({}, originalModule), { useRouteMatch: jest.fn(function () {
            return { url: '/board/view' };
        }) });
});
describe('components/viewHeader/ViewHeaderSearch', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
        },
        searchText: {}
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('return search menu', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSearch_1["default"] />
        </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return input after click on search button', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSearch_1["default"] />
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button');
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('search text after input after click on search button and search text', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderSearch_1["default"] />
        </react_redux_1.Provider>)).container;
        user_event_1["default"].click(react_1.screen.getByRole('button'));
        var elementSearchText = react_1.screen.getByPlaceholderText('Search text');
        user_event_1["default"].type(elementSearchText, 'Hello');
        expect(container).toMatchSnapshot();
    });
});
