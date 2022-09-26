"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_redux_1 = require("react-redux");
var react_2 = require("@testing-library/react");
var redux_mock_store_1 = require("redux-mock-store");
var card_1 = require("../../../blocks/card");
var createdBy_1 = require("./createdBy");
describe('components/properties/createdBy', function () {
    test('should match snapshot', function () {
        var card = (0, card_1.createCard)();
        card.createdBy = 'user-id-1';
        var mockStore = (0, redux_mock_store_1["default"])([]);
        var store = mockStore({
            users: {
                workspaceUsers: {
                    'user-id-1': { username: 'username_1' }
                }
            }
        });
        var component = (<react_redux_1.Provider store={store}>
        <createdBy_1["default"] userID='user-id-1'/>
      </react_redux_1.Provider>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
