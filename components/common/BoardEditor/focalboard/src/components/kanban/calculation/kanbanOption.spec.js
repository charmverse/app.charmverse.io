"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var testBlockFactory_1 = require("../../../test/testBlockFactory");
var kanbanOption_1 = require("./kanbanOption");
describe('components/kanban/calculations/Option', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    test('base case', function () {
        var component = (<kanbanOption_1.Option data={{
                label: 'Count Unique Values',
                displayName: 'Unique',
                value: 'countUniqueValue',
                cardProperties: board.fields.cardProperties,
                onChange: function () { },
                activeValue: 'count',
                activeProperty: board.fields.cardProperties[1]
            }}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
