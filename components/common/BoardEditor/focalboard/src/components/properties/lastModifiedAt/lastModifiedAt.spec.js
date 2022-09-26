"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var testUtils_1 = require("../../../testUtils");
var card_1 = require("../../../blocks/card");
var lastModifiedAt_1 = require("./lastModifiedAt");
describe('componnets/properties/lastModifiedAt', function () {
    test('should match snapshot', function () {
        var card = (0, card_1.createCard)();
        card.id = 'card-id-1';
        var component = (0, testUtils_1.wrapIntl)(<lastModifiedAt_1["default"] updatedAt=''/>);
        var container = (0, react_2.render)(component).container;
        expect(container).toMatchSnapshot();
    });
});
