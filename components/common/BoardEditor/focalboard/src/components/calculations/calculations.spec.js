"use strict";
exports.__esModule = true;
var react_intl_1 = require("react-intl");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var calculations_1 = require("./calculations");
describe('components/calculations/calculation logic', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card1.fields.properties.property_text = 'lorem ipsum';
    card1.fields.properties.property_number = '100';
    card1.fields.properties.property_email = 'foobar@example.com';
    card1.fields.properties.property_phone = '+1 1234567890';
    card1.fields.properties.property_url = 'example.com';
    card1.fields.properties.property_select = 'option_id_1';
    card1.fields.properties.property_multiSelect = ['option_id_1', 'option_id_2', 'option_id_3'];
    card1.fields.properties.property_date = '1625553000000';
    card1.fields.properties.property_person = 'user_id_1';
    card1.fields.properties.property_checkbox = 'true';
    card1.createdBy = 'user_id_1';
    card1.createdAt = 1625553000000;
    card1.updatedBy = 'user_id_1';
    card1.updatedAt = 1625553000000;
    var card2 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card2.fields.properties.property_text = 'foo bar';
    card2.fields.properties.property_number = '-30';
    card2.fields.properties.property_email = 'loremipsum@example.com';
    card2.fields.properties.property_phone = '+1 111';
    card2.fields.properties.property_url = 'example.com/foobar';
    card2.fields.properties.property_select = 'option_id_2';
    card2.fields.properties.property_multiSelect = ['option_id_2', 'option_id_3'];
    card2.fields.properties.property_date = '1625639400000';
    card2.fields.properties.property_person = 'user_id_2';
    card2.fields.properties.property_checkbox = 'false';
    card2.createdAt = 1625639400000;
    card2.createdBy = 'user_id_2';
    card2.updatedAt = 1625639400000;
    card2.updatedBy = 'user_id_2';
    // card with all properties unset
    var card3 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card3.createdAt = 1625639400000;
    card3.createdBy = 'user_id_2';
    card3.updatedAt = 1625639400000;
    card3.updatedBy = 'user_id_2';
    // clone of card 1. All properties exactly same as that of card 1
    var card4 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card4.fields.properties.property_text = 'lorem ipsum';
    card4.fields.properties.property_number = '100';
    card4.fields.properties.property_email = 'foobar@example.com';
    card4.fields.properties.property_phone = '+1 1234567890';
    card4.fields.properties.property_url = 'example.com';
    card4.fields.properties.property_select = 'option_id_1';
    card4.fields.properties.property_multiSelect = ['option_id_1', 'option_id_2', 'option_id_3'];
    card4.fields.properties.property_date = '1625553000000';
    card4.fields.properties.property_person = 'user_id_1';
    card4.fields.properties.property_checkbox = 'true';
    card4.createdAt = 1625553000000;
    card4.createdBy = 'user_id_1';
    card4.updatedAt = 1625553000000;
    card4.updatedBy = 'user_id_1';
    // card with all empty values
    var card5 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card5.fields.properties.property_text = '';
    card5.fields.properties.property_number = '';
    card5.fields.properties.property_email = '';
    card5.fields.properties.property_phone = '';
    card5.fields.properties.property_url = '';
    card5.fields.properties.property_select = '';
    card5.fields.properties.property_multiSelect = [];
    card5.fields.properties.property_date = '';
    card5.fields.properties.property_person = '';
    card5.fields.properties.property_checkbox = '';
    // clone of card 3 but created / updated 1 second later
    var card6 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card6.createdAt = 1625639401000;
    card6.createdBy = 'user_id_2';
    card6.updatedAt = 1625639401000;
    card6.updatedBy = 'user_id_2';
    // clone of card 3 but created / updated 1 minute later
    var card7 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card7.createdAt = 1625639460000;
    card7.createdBy = 'user_id_2';
    card7.updatedAt = 1625639460000;
    card7.updatedBy = 'user_id_2';
    var cards = [card1, card2, card3, card4];
    var properties = {
        text: { id: 'property_text', type: 'text', name: '', options: [] },
        number: { id: 'property_number', type: 'number', name: '', options: [] },
        email: { id: 'property_email', type: 'email', name: '', options: [] },
        phone: { id: 'property_phone', type: 'phone', name: '', options: [] },
        url: { id: 'property_url', type: 'url', name: '', options: [] },
        select: {
            id: 'property_select',
            type: 'select',
            name: '',
            options: [
                {
                    color: 'propColorYellow',
                    id: 'option_id_1',
                    value: 'Option 1'
                },
                {
                    color: 'propColorBlue',
                    id: 'option_id_2',
                    value: 'Option 2'
                }
            ]
        },
        multiSelect: {
            id: 'property_multiSelect',
            type: 'multiSelect',
            name: '',
            options: [
                {
                    color: 'propColorYellow',
                    id: 'option_id_1',
                    value: 'Option 1'
                },
                {
                    color: 'propColorBlue',
                    id: 'option_id_2',
                    value: 'Option 2'
                },
                {
                    color: 'propColorBlue',
                    id: 'option_id_3',
                    value: 'Option 3'
                }
            ]
        },
        date: { id: 'property_date', type: 'date', name: '', options: [] },
        person: { id: 'property_person', type: 'person', name: '', options: [] },
        checkbox: { id: 'property_checkbox', type: 'checkbox', name: '', options: [] },
        createdTime: { id: 'property_createdTime', type: 'createdTime', name: '', options: [] },
        createdBy: { id: 'property_createdBy', type: 'createdBy', name: '', options: [] },
        updatedTime: { id: 'property_lastUpdatedTime', type: 'updatedTime', name: '', options: [] },
        updatedBy: { id: 'property_lastUpdatedBy', type: 'updatedBy', name: '', options: [] }
    };
    var autofilledProperties = new Set([properties.createdBy, properties.createdTime, properties.updatedBy, properties.updatedTime]);
    var intl = (0, react_intl_1.createIntl)({ locale: 'en-us' });
    // testing count
    Object.values(properties).forEach(function (property) {
        it("should correctly count for property type \"".concat(property.type, "\""), function () {
            expect(calculations_1["default"].count(cards, property, intl)).toBe('4');
        });
    });
    // testing count empty
    Object.values(properties).filter(function (p) { return !autofilledProperties.has(p); }).forEach(function (property) {
        it("should correctly count empty for property type \"".concat(property.type, "\""), function () {
            expect(calculations_1["default"].countEmpty(cards, property, intl)).toBe('1');
        });
    });
    // testing percent empty
    Object.values(properties).filter(function (p) { return !autofilledProperties.has(p); }).forEach(function (property) {
        it("should correctly compute empty percent for property type \"".concat(property.type, "\""), function () {
            expect(calculations_1["default"].percentEmpty(cards, property, intl)).toBe('25%');
        });
    });
    // testing count not empty
    Object.values(properties).filter(function (p) { return !autofilledProperties.has(p); }).forEach(function (property) {
        it("should correctly count not empty for property type \"".concat(property.type, "\""), function () {
            expect(calculations_1["default"].countNotEmpty(cards, property, intl)).toBe('3');
        });
    });
    // testing percent not empty
    Object.values(properties).filter(function (p) { return !autofilledProperties.has(p); }).forEach(function (property) {
        it("should correctly compute not empty percent for property type \"".concat(property.type, "\""), function () {
            expect(calculations_1["default"].percentNotEmpty(cards, property, intl)).toBe('75%');
        });
    });
    // testing countValues
    var countValueTests = {
        text: '3',
        number: '3',
        email: '3',
        phone: '3',
        url: '3',
        select: '3',
        multiSelect: '8',
        date: '3',
        person: '3',
        checkbox: '3',
        createdTime: '4',
        createdBy: '4',
        updatedTime: '4',
        updatedBy: '4'
    };
    Object.keys(countValueTests).forEach(function (propertyType) {
        it("should correctly count values for property type ".concat(propertyType), function () {
            expect(calculations_1["default"].countValue(cards, properties[propertyType], intl)).toBe(countValueTests[propertyType]);
        });
    });
    // testing countUniqueValue
    var countUniqueValueTests = {
        text: '2',
        number: '2',
        email: '2',
        phone: '2',
        url: '2',
        select: '2',
        multiSelect: '3',
        date: '2',
        person: '2',
        checkbox: '2',
        createdTime: '2',
        createdBy: '2',
        updatedTime: '2',
        updatedBy: '2'
    };
    Object.keys(countUniqueValueTests).forEach(function (propertyType) {
        it("should correctly count unique values for property type ".concat(propertyType), function () {
            expect(calculations_1["default"].countUniqueValue(cards, properties[propertyType], intl)).toBe(countUniqueValueTests[propertyType]);
        });
    });
    test('countUniqueValue for cards created 1 second apart', function () {
        var result = calculations_1["default"].countUniqueValue([card3, card6], properties.createdTime, intl);
        expect(result).toBe('1');
    });
    test('countUniqueValue for cards updated 1 second apart', function () {
        var result = calculations_1["default"].countUniqueValue([card3, card6], properties.updatedTime, intl);
        expect(result).toBe('1');
    });
    test('countUniqueValue for cards created 1 minute apart', function () {
        var result = calculations_1["default"].countUniqueValue([card3, card7], properties.createdTime, intl);
        expect(result).toBe('2');
    });
    test('countUniqueValue for cards updated 1 minute apart', function () {
        var result = calculations_1["default"].countUniqueValue([card3, card7], properties.updatedTime, intl);
        expect(result).toBe('2');
    });
    test('countChecked for cards', function () {
        var result = calculations_1["default"].countChecked(cards, properties.checkbox, intl);
        expect(result).toBe('3');
    });
    test('countChecked for cards, one set, other unset', function () {
        var result = calculations_1["default"].countChecked([card1, card5], properties.checkbox, intl);
        expect(result).toBe('1');
    });
    test('countUnchecked for cards', function () {
        var result = calculations_1["default"].countUnchecked(cards, properties.checkbox, intl);
        expect(result).toBe('1');
    });
    test('countUnchecked for cards, two set, one unset', function () {
        var result = calculations_1["default"].countUnchecked([card1, card1, card5], properties.checkbox, intl);
        expect(result).toBe('1');
    });
    test('countUnchecked for cards, one set, other unset', function () {
        var result = calculations_1["default"].countUnchecked([card1, card5], properties.checkbox, intl);
        expect(result).toBe('1');
    });
    test('countUnchecked for cards, one set, two unset', function () {
        var result = calculations_1["default"].countUnchecked([card1, card5, card5], properties.checkbox, intl);
        expect(result).toBe('2');
    });
    test('percentChecked for cards', function () {
        var result = calculations_1["default"].percentChecked(cards, properties.checkbox, intl);
        expect(result).toBe('75%');
    });
    test('percentUnchecked for cards', function () {
        var result = calculations_1["default"].percentUnchecked(cards, properties.checkbox, intl);
        expect(result).toBe('25%');
    });
    test('sum', function () {
        var result = calculations_1["default"].sum(cards, properties.number, intl);
        expect(result).toBe('170');
    });
    test('average', function () {
        var result = calculations_1["default"].average(cards, properties.number, intl);
        expect(result).toBe('56.67');
    });
    test('median', function () {
        var result = calculations_1["default"].median(cards, properties.number, intl);
        expect(result).toBe('100');
    });
    test('min', function () {
        var result = calculations_1["default"].min(cards, properties.number, intl);
        expect(result).toBe('-30');
    });
    test('max', function () {
        var result = calculations_1["default"].max(cards, properties.number, intl);
        expect(result).toBe('100');
    });
    test('range', function () {
        var result = calculations_1["default"].range(cards, properties.number, intl);
        expect(result).toBe('-30 - 100');
    });
});
