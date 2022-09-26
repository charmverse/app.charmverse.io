"use strict";
exports.__esModule = true;
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var react_redux_1 = require("react-redux");
var user_event_1 = require("@testing-library/user-event");
var mutator_1 = require("../../mutator");
var utils_1 = require("../../utils");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var kanbanCard_1 = require("./kanbanCard");
jest.mock('../../mutator');
jest.mock('../../utils');
// jest.mock('../../telemetry/telemetryClient')
var mockedUtils = jest.mocked(utils_1.Utils, true);
var mockedMutator = jest.mocked(mutator_1["default"], true);
describe('src/components/kanban/kanbanCard', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var propertyTemplate = {
        id: 'id',
        name: 'name',
        type: 'text',
        options: [
            {
                color: 'propColorOrange',
                id: 'property_value_id_1',
                value: 'Q1'
            },
            {
                color: 'propColorBlue',
                id: 'property_value_id_2',
                value: 'Q2'
            }
        ]
    };
    var state = {
        cards: {
            cards: [card]
        },
        contents: {},
        comments: {
            comments: {}
        }
    };
    var store = (0, testUtils_1.mockStateStore)([], state);
    beforeEach(jest.clearAllMocks);
    test('should match snapshot', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanbanCard_1["default"] card={card} board={board} visiblePropertyTemplates={[propertyTemplate]} visibleBadges={false} isSelected={false} readonly={false} onDrop={jest.fn()} showCard={jest.fn()} isManualSort={false}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot with readonly', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanbanCard_1["default"] card={card} board={board} visiblePropertyTemplates={[propertyTemplate]} visibleBadges={false} isSelected={false} readonly={true} onDrop={jest.fn()} showCard={jest.fn()} isManualSort={false}/>
      </react_redux_1.Provider>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return kanbanCard and click on delete menu ', function () {
        var result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanbanCard_1["default"] card={card} board={board} visiblePropertyTemplates={[propertyTemplate]} visibleBadges={false} isSelected={false} readonly={false} onDrop={jest.fn()} showCard={jest.fn()} isManualSort={false}/>
      </react_redux_1.Provider>));
        var container = result.container;
        var elementMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(elementMenuWrapper).not.toBeNull();
        user_event_1["default"].click(elementMenuWrapper);
        expect(container).toMatchSnapshot();
        var elementButtonDelete = (0, react_1.within)(elementMenuWrapper).getByRole('button', { name: 'Delete' });
        expect(elementButtonDelete).not.toBeNull();
        user_event_1["default"].click(elementButtonDelete);
        var confirmDialog = react_1.screen.getByTitle('Confirmation Dialog Box');
        expect(confirmDialog).toBeDefined();
        var confirmButton = (0, react_1.within)(confirmDialog).getByRole('button', { name: 'Delete' });
        expect(confirmButton).toBeDefined();
        user_event_1["default"].click(confirmButton);
        expect(mockedMutator.deleteBlock).toBeCalledWith(card, 'delete card');
    });
    test('return kanbanCard and click on duplicate menu ', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanbanCard_1["default"] card={card} board={board} visiblePropertyTemplates={[propertyTemplate]} visibleBadges={false} isSelected={false} readonly={false} onDrop={jest.fn()} showCard={jest.fn()} isManualSort={false}/>
      </react_redux_1.Provider>)).container;
        var elementMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(elementMenuWrapper).not.toBeNull();
        user_event_1["default"].click(elementMenuWrapper);
        expect(container).toMatchSnapshot();
        var elementButtonDuplicate = (0, react_1.within)(elementMenuWrapper).getByRole('button', { name: 'Duplicate' });
        expect(elementButtonDuplicate).not.toBeNull();
        user_event_1["default"].click(elementButtonDuplicate);
        expect(mockedMutator.duplicateCard).toBeCalledTimes(1);
    });
    test('return kanbanCard and click on copy link menu ', function () {
        var container = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <kanbanCard_1["default"] card={card} board={board} visiblePropertyTemplates={[propertyTemplate]} visibleBadges={false} isSelected={false} readonly={false} onDrop={jest.fn()} showCard={jest.fn()} isManualSort={false}/>
      </react_redux_1.Provider>)).container;
        var elementMenuWrapper = react_1.screen.getByRole('button', { name: 'menuwrapper' });
        expect(elementMenuWrapper).not.toBeNull();
        user_event_1["default"].click(elementMenuWrapper);
        expect(container).toMatchSnapshot();
        var elementButtonCopyLink = (0, react_1.within)(elementMenuWrapper).getByRole('button', { name: 'Copy link' });
        expect(elementButtonCopyLink).not.toBeNull();
        user_event_1["default"].click(elementButtonCopyLink);
        expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1);
    });
});
