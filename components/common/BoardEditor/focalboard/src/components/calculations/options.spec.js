"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var react_2 = require("react");
var testUtils_1 = require("../../testUtils");
var options_1 = require("./options");
describe('components/calculations/Options', function () {
    test('should match snapshot', function () {
        var property = {
            type: 'number'
        };
        var component = (0, testUtils_1.wrapIntl)(<options_1.CalculationOptions value='none' onChange={function () { }} property={property} menuOpen={false} options={[{
                    label: 'Count',
                    value: 'count',
                    displayName: 'Count'
                }]}/>);
        var container = (0, react_1.render)(component).container;
        expect(container).toMatchSnapshot();
    });
    test('should match snapshot menu open', function () {
        var property = {
            type: 'number'
        };
        var component = (0, testUtils_1.wrapIntl)(<options_1.CalculationOptions value='none' menuOpen={true} onChange={function () { }} property={property} options={[
                {
                    label: 'Count',
                    value: 'count',
                    displayName: 'Count'
                },
                {
                    label: 'Max',
                    value: 'max',
                    displayName: 'Max'
                }
            ]}/>);
        var container = (0, react_1.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
