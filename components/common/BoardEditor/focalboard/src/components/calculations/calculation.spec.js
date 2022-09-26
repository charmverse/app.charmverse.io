"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var testUtils_1 = require("../../testUtils");
var tableCalculationOptions_1 = require("../table/calculation/tableCalculationOptions");
var calculation_1 = require("./calculation");
describe('components/calculations/Calculation', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    card.fields.properties.property_2 = 'Foo';
    card.fields.properties.property_3 = 'Bar';
    card.fields.properties.property_4 = 'Baz';
    var card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card2.fields.properties.property_2 = 'Lorem';
    card2.fields.properties.property_3 = '';
    card2.fields.properties.property_4 = 'Baz';
    test('should match snapshot - none', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculation_1["default"] style={{}} class='fooClass' value='none' menuOpen={false} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} cards={[card, card2]} hovered={true} property={{
                id: 'property_2',
                name: '',
                type: 'text',
                options: []
            }} optionsComponent={tableCalculationOptions_1.TableCalculationOptions}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot - count', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculation_1["default"] style={{}} class='fooClass' value='count' menuOpen={false} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} cards={[card, card2]} hovered={true} property={{
                id: 'property_2',
                name: '',
                type: 'text',
                options: []
            }} optionsComponent={tableCalculationOptions_1.TableCalculationOptions}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot - countValue', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculation_1["default"] style={{}} class='fooClass' value='countValue' menuOpen={false} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} cards={[card, card2]} hovered={true} property={{
                id: 'property_3',
                name: '',
                type: 'text',
                options: []
            }} optionsComponent={tableCalculationOptions_1.TableCalculationOptions}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot - countUniqueValue', function () {
        var component = (0, testUtils_1.wrapIntl)(<calculation_1["default"] style={{}} class='fooClass' value='countUniqueValue' menuOpen={false} onMenuClose={function () { }} onMenuOpen={function () { }} onChange={function () { }} cards={[card, card2]} hovered={true} property={{
                id: 'property_4',
                name: '',
                type: 'text',
                options: []
            }} optionsComponent={tableCalculationOptions_1.TableCalculationOptions}/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot - option change', function () {
        var onMenuOpen = jest.fn();
        var onMenuClose = jest.fn();
        var onChange = jest.fn();
        var component = (0, testUtils_1.wrapIntl)(<calculation_1["default"] style={{}} class='fooClass' value='none' menuOpen={true} onMenuClose={onMenuClose} onMenuOpen={onMenuOpen} onChange={onChange} cards={[card, card2]} hovered={true} property={{
                id: 'property_2',
                name: '',
                type: 'text',
                options: []
            }} optionsComponent={tableCalculationOptions_1.TableCalculationOptions}/>);
        var container = (0, react_2.render)(component).container;
        var countMenuOption = container.querySelector('#react-select-2-option-1');
        user_event_1["default"].click(countMenuOption);
        expect(container).toMatchSnapshot();
        expect(onMenuOpen).not.toBeCalled();
        expect(onMenuClose).toBeCalled();
        expect(onChange).toBeCalled();
    });
});
