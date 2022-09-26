"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var testBlockFactory_1 = require("../../../test/testBlockFactory");
var testUtils_1 = require("../../../testUtils");
var calculation_1 = require("./calculation");
describe('components/kanban/calculation/KanbanCalculation', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var cards = [
        testBlockFactory_1.TestBlockFactory.createCard(board),
        testBlockFactory_1.TestBlockFactory.createCard(board),
        testBlockFactory_1.TestBlockFactory.createCard(board)
    ];
    test('base case', function () {
        var component = (0, testUtils_1.wrapIntl)((<calculation_1.KanbanCalculation cards={cards} cardProperties={board.fields.cardProperties} menuOpen={false} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} value='count' property={board.fields.cardProperties[0]} readonly={false}/>));
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('calculations menu open', function () {
        var component = (0, testUtils_1.wrapIntl)((<calculation_1.KanbanCalculation cards={cards} cardProperties={board.fields.cardProperties} menuOpen={true} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} value='count' property={board.fields.cardProperties[0]} readonly={false}/>));
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('no menu should appear in readonly mode', function () {
        var component = (0, testUtils_1.wrapIntl)((<calculation_1.KanbanCalculation cards={cards} cardProperties={board.fields.cardProperties} menuOpen={true} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} value='count' property={board.fields.cardProperties[0]} readonly={true}/>));
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
