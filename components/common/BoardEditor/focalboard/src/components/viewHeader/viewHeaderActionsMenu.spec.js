"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
require("@testing-library/jest-dom");
var user_event_1 = require("@testing-library/user-event");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var archiver_1 = require("../../archiver");
var csvExporter_1 = require("../../csvExporter");
var viewHeaderActionsMenu_1 = require("./viewHeaderActionsMenu");
jest.mock('../../archiver');
jest.mock('../../csvExporter');
jest.mock('../../mutator');
var mockedArchiver = jest.mocked(archiver_1.Archiver, true);
var mockedCsvExporter = jest.mocked(csvExporter_1.CsvExporter, true);
var board = testBlockFactory_1.TestBlockFactory.createBoard();
var activeView = testBlockFactory_1.TestBlockFactory.createBoardView(board);
var card = testBlockFactory_1.TestBlockFactory.createCard(board);
describe('components/viewHeader/viewHeaderActionsMenu', function () {
    var state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'
            }
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(function () {
        jest.clearAllMocks();
    });
    test('return menu with Share Boards', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderActionsMenu_1["default"] board={board} activeView={activeView} cards={[card]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', {
            name: 'View menu'
        });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return menu without Share Boards', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderActionsMenu_1["default"] board={board} activeView={activeView} cards={[card]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', {
            name: 'View menu'
        });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
    });
    test('return menu and verify call to csv exporter', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderActionsMenu_1["default"] board={board} activeView={activeView} cards={[card]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'View menu' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonExportCSV = react_1.screen.getByRole('button', { name: 'Export to CSV' });
        user_event_1["default"].click(buttonExportCSV);
        expect(mockedCsvExporter.exportTableCsv).toBeCalledTimes(1);
    });
    test('return menu and verify call to board archive', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapIntl)(<react_redux_1.Provider store={store}>
          <viewHeaderActionsMenu_1["default"] board={board} activeView={activeView} cards={[card]}/>
        </react_redux_1.Provider>)).container;
        var buttonElement = react_1.screen.getByRole('button', { name: 'View menu' });
        user_event_1["default"].click(buttonElement);
        expect(container).toMatchSnapshot();
        var buttonExportBoardArchive = react_1.screen.getByRole('button', { name: 'Export board archive' });
        user_event_1["default"].click(buttonExportBoardArchive);
        expect(mockedArchiver.exportBoardArchive).toBeCalledTimes(1);
        expect(mockedArchiver.exportBoardArchive).toBeCalledWith(board);
    });
});
