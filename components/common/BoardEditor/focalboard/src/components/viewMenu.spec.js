"use strict";
exports.__esModule = true;
// @ts-nocheck
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
require("isomorphic-fetch");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var react_router_dom_1 = require("react-router-dom");
var history_1 = require("history");
var redux_mock_store_1 = require("redux-mock-store");
var fetchMock_1 = require("../test/fetchMock");
var testBlockFactory_1 = require("../test/testBlockFactory");
var testUtils_1 = require("../testUtils");
var viewMenu_1 = require("./viewMenu");
global.fetch = fetchMock_1.FetchMock.fn;
beforeEach(function () {
    fetchMock_1.FetchMock.fn.mockReset();
});
describe('/components/viewMenu', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var boardView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var tableView = testBlockFactory_1.TestBlockFactory.createTableView(board);
    var activeView = boardView;
    var views = [boardView, tableView];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    activeView.fields.viewType = 'table';
    activeView.fields.groupById = undefined;
    activeView.fields.visiblePropertyIds = ['property1', 'property2'];
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
        },
        clientConfig: {}
    };
    var history = (0, history_1.createMemoryHistory)();
    it('should match snapshot', function () {
        var mockStore = (0, redux_mock_store_1["default"])([]);
        var store = mockStore(state);
        var component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <react_router_dom_1.Router history={history}>
          <viewMenu_1["default"] board={board} activeView={activeView} views={views} readonly={false}/>
        </react_router_dom_1.Router>
      </react_redux_1.Provider>);
        var container = (0, react_1.render)(component);
        expect(container).toMatchSnapshot();
    });
    it('should match snapshot, read only', function () {
        var mockStore = (0, redux_mock_store_1["default"])([]);
        var store = mockStore(state);
        var component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <react_router_dom_1.Router history={history}>
          <viewMenu_1["default"] board={board} activeView={activeView} views={views} readonly={true}/>
        </react_router_dom_1.Router>
      </react_redux_1.Provider>);
        var container = (0, react_1.render)(component);
        expect(container).toMatchSnapshot();
    });
});
