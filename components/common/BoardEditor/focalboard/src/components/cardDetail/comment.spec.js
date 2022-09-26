"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var testUtils_1 = require("../../testUtils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var mutator_1 = require("../../mutator");
var comment_1 = require("./comment");
jest.mock('../../mutator');
var mockedMutator = jest.mocked(mutator_1["default"], true);
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var card = testBlockFactory_1.TestBlockFactory.createCard(board);
var comment = testBlockFactory_1.TestBlockFactory.createComment(card);
var dateFixed = Date.parse('01 Oct 2020');
comment.createdAt = dateFixed;
comment.updatedAt = dateFixed;
comment.title = 'Test comment';
var contributor = { username: 'Test user', avatar: null };
describe('components/cardDetail/comment', function () {
    var state = {
        users: {
            workspaceUsers: [
                { username: 'username_1' }
            ]
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
        // moment.now = () => {
        //     return dateFixed + (24 * 60 * 60 * 1000)
        // }
    });
    afterEach(function () {
        // moment.now = () => {
        //     return Number(new Date())
        // }
    });
    test('return comment', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
        <comment_1["default"] comment={comment} contributor={contributor} readonly={false}/>
      </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return comment readonly', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
        <comment_1["default"] comment={comment} contributor={contributor} readonly={true}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return comment and delete comment', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
        <comment_1["default"] comment={comment} contributor={contributor} readonly={false}/>
      </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonDelete = react_1.screen.getByRole('button', { name: 'Delete' });
        user_event_1["default"].click(buttonDelete);
        expect(mockedMutator.deleteBlock).toBeCalledTimes(1);
        expect(mockedMutator.deleteBlock).toBeCalledWith(comment);
    });
});
