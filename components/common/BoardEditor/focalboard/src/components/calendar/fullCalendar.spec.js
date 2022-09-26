"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var testBlockFactory_1 = require("../../test/testBlockFactory");
require("@testing-library/jest-dom");
var testUtils_1 = require("../../testUtils");
var fullCalendar_1 = require("./fullCalendar");
jest.mock('../../mutator');
describe('components/calendar/toolbar', function () {
    var mockShow = jest.fn();
    var mockAdd = jest.fn();
    var dateDisplayProperty = {
        id: '12345',
        name: 'DateProperty',
        type: 'date',
        options: []
    };
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'calendar';
    view.fields.groupById = undefined;
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var fifth = Date.UTC(2021, 9, 5, 12);
    var twentieth = Date.UTC(2021, 9, 20, 12);
    card.createdAt = fifth;
    var rObject = { from: twentieth };
    test('return calendar, no date property', function () {
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<fullCalendar_1["default"] board={board} activeView={view} cards={[card]} readonly={false} showCard={mockShow} addCard={mockAdd} initialDate={new Date(fifth)}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return calendar, with date property not set', function () {
        board.fields.cardProperties.push(dateDisplayProperty);
        card.fields.properties['12345'] = JSON.stringify(rObject);
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<fullCalendar_1["default"] board={board} activeView={view} cards={[card]} readonly={false} showCard={mockShow} addCard={mockAdd} initialDate={new Date(fifth)}/>)).container;
        expect(container).toMatchSnapshot();
    });
    test('return calendar, with date property set', function () {
        board.fields.cardProperties.push(dateDisplayProperty);
        card.fields.properties['12345'] = JSON.stringify(rObject);
        var container = (0, react_2.render)((0, testUtils_1.wrapIntl)(<fullCalendar_1["default"] board={board} activeView={view} readonly={false} dateDisplayProperty={dateDisplayProperty} cards={[card]} showCard={mockShow} addCard={mockAdd} initialDate={new Date(fifth)}/>)).container;
        expect(container).toMatchSnapshot();
    });
});
