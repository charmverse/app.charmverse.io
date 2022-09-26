"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var testBlockFactory_1 = require("../../../test/testBlockFactory");
var testUtils_1 = require("../../../testUtils");
var calculationOptions_1 = require("./calculationOptions");
describe('components/kanban/calculations/KanbanCalculationOptions', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    test('base case', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculationOptions_1.KanbanCalculationOptions value='count' property={board.fields.cardProperties[1]} menuOpen={false} onChange={function () { }} cardProperties={board.fields.cardProperties}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('with menu open', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculationOptions_1.KanbanCalculationOptions value='count' property={board.fields.cardProperties[1]} menuOpen={true} onChange={function () { }} cardProperties={board.fields.cardProperties}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('with submenu open', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculationOptions_1.KanbanCalculationOptions value='count' property={board.fields.cardProperties[1]} menuOpen={true} onChange={function () { }} cardProperties={board.fields.cardProperties}/>);
        var _a = (0, react_2.render)(component), container = _a.container, getByText = _a.getByText;
        var countUniqueValuesOption = getByText('Count Unique Values');
        expect(countUniqueValuesOption).toBeDefined();
        user_event_1["default"].hover(countUniqueValuesOption);
        expect(container).toMatchSnapshot();
    });
    test('duplicate property types', function () {
        var boardWithProps = testBlockFactory_1.TestBlockFactory.createBoard();
        boardWithProps.fields.cardProperties.push({
            id: 'number-property-1',
            name: 'A Number Property - 1',
            type: 'number',
            options: []
        });
        boardWithProps.fields.cardProperties.push({
            id: 'number-property-2',
            name: 'A Number Propert - 2y',
            type: 'number',
            options: []
        });
        var component = (0, testUtils_1.wrapIntl)(<calculationOptions_1.KanbanCalculationOptions value='count' property={boardWithProps.fields.cardProperties[1]} menuOpen={true} onChange={function () { }} cardProperties={boardWithProps.fields.cardProperties}/>);
        var getAllByText = (0, react_2.render)(component).getAllByText;
        var sumOptions = getAllByText('Sum');
        expect(sumOptions).toBeDefined();
        expect(sumOptions.length).toBe(1);
    });
    test('effectively date fields', function () {
        // date, created time and updated time are effectively date fields.
        // Only one set of date related menus should show up for all of them.
        var boardWithProps = testBlockFactory_1.TestBlockFactory.createBoard();
        boardWithProps.fields.cardProperties.push({
            id: 'date',
            name: 'Date',
            type: 'date',
            options: []
        });
        boardWithProps.fields.cardProperties.push({
            id: 'created-time',
            name: 'Created Time',
            type: 'createdTime',
            options: []
        });
        boardWithProps.fields.cardProperties.push({
            id: 'updated-time',
            name: 'Updated Time',
            type: 'updatedTime',
            options: []
        });
        var component = (0, testUtils_1.wrapIntl)(<calculationOptions_1.KanbanCalculationOptions value='count' property={boardWithProps.fields.cardProperties[1]} menuOpen={true} onChange={function () { }} cardProperties={boardWithProps.fields.cardProperties}/>);
        var getAllByText = (0, react_2.render)(component).getAllByText;
        var earliestDateMenu = getAllByText('Earliest Date');
        expect(earliestDateMenu).toBeDefined();
        expect(earliestDateMenu.length).toBe(1);
        var latestDateMenu = getAllByText('Latest Date');
        expect(latestDateMenu).toBeDefined();
        expect(latestDateMenu.length).toBe(1);
        var dateRangeMenu = getAllByText('Date Range');
        expect(dateRangeMenu).toBeDefined();
        expect(dateRangeMenu.length).toBe(1);
    });
});
