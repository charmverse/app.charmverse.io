"use strict";
// @ts-nocheck
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
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var viewHeader_1 = require("./viewHeader");
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var card = testBlockFactory_1.TestBlockFactory.createCard(board);
jest.mock('react-router-dom', function () {
    var originalModule = jest.requireActual('react-router-dom');
    return __assign(__assign({}, originalModule), { useRouteMatch: jest.fn(function () {
            return { url: '/board/view' };
        }) });
});
describe('components/viewHeader/viewHeader', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
        },
        searchText: {},
        boards: {
            current: board
        },
        cards: {
            templates: [card]
        },
        views: {
            views: {
                boardView: activeView
            },
            current: 'boardView'
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    test('return viewHeader', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeader_1["default"] board={board} activeView={activeView} views={[activeView]} cards={[card]} groupByProperty={board.fields.cardProperties[0]} addCard={jest.fn()} addCardFromTemplate={jest.fn()} addCardTemplate={jest.fn()} editCardTemplate={jest.fn()} readonly={false}/>
        </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return viewHeader readonly', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeader_1["default"] board={board} activeView={activeView} views={[activeView]} cards={[card]} groupByProperty={board.fields.cardProperties[0]} addCard={jest.fn()} addCardFromTemplate={jest.fn()} addCardTemplate={jest.fn()} editCardTemplate={jest.fn()} readonly={true}/>
        </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
});
