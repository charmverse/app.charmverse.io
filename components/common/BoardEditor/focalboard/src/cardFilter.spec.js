"use strict";
exports.__esModule = true;
var filterClause_1 = require("./blocks/filterClause");
var filterGroup_1 = require("./blocks/filterGroup");
var cardFilter_1 = require("./cardFilter");
var testBlockFactory_1 = require("./test/testBlockFactory");
var utils_1 = require("./utils");
jest.mock('./utils');
var mockedUtils = jest.mocked(utils_1.Utils, true);
describe('src/cardFilter', function () {
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    board.id = '1';
    board.rootId = '1';
    var card1 = testBlockFactory_1.TestBlockFactory.createCard(board);
    card1.id = '1';
    card1.title = 'card1';
    card1.fields.properties.propertyId = 'Status';
    var filterClause = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
    describe('verify isClauseMet method', function () {
        test('should be true with isNotEmpty clause', function () {
            var filterClauseIsNotEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseIsNotEmpty, [], card1);
            expect(result).toBeTruthy();
        });
        test('should be false with isEmpty clause', function () {
            var filterClauseIsEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isEmpty', values: ['Status'] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseIsEmpty, [], card1);
            expect(result).toBeFalsy();
        });
        test('should be true with includes clause', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseIncludes, [], card1);
            expect(result).toBeTruthy();
        });
        test('should be true with includes and no values clauses', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: [] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseIncludes, [], card1);
            expect(result).toBeTruthy();
        });
        test('should be false with notIncludes clause', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseNotIncludes, [], card1);
            expect(result).toBeFalsy();
        });
        test('should be true with notIncludes and no values clauses', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: [] });
            var result = cardFilter_1.CardFilter.isClauseMet(filterClauseNotIncludes, [], card1);
            expect(result).toBeTruthy();
        });
    });
    describe('verify isFilterGroupMet method', function () {
        test('should return true with no filter', function () {
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: []
            });
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeTruthy();
        });
        test('should return true with or operation and 2 filterCause, one is false ', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeTruthy();
        });
        test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterGroupInFilterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause
                ]
            });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: []
            });
            filterGroup.filters.push(filterGroupInFilterGroup);
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeTruthy();
        });
        test('should return false with or operation and two filterCause, two are false ', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterClauseEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isEmpty', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClauseEmpty
                ]
            });
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeFalsy();
        });
        test('should return false with and operation and 2 filterCause, one is false ', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: [
                    filterClauseNotIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeFalsy();
        });
        test('should return true with and operation and 2 filterCause, two are true ', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeTruthy();
        });
        test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterGroupInFilterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: [
                    filterClauseNotIncludes,
                    filterClause
                ]
            });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: []
            });
            filterGroup.filters.push(filterGroupInFilterGroup);
            var result = cardFilter_1.CardFilter.isFilterGroupMet(filterGroup, [], card1);
            expect(result).toBeFalsy();
        });
    });
    describe('verify propertyThatMeetsFilterClause method', function () {
        test('should return Utils.assertFailure and filterClause propertyId ', function () {
            var filterClauseIsNotEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, []);
            expect(mockedUtils.assertFailure).toBeCalledTimes(1);
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
        });
        test('should return filterClause propertyId with non-select template and isNotEmpty clause ', function () {
            var filterClauseIsNotEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
            var templateFilter = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
            expect(result.value).toBeFalsy();
        });
        test('should return filterClause propertyId with select template , an option and isNotEmpty clause ', function () {
            var filterClauseIsNotEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
            var templateFilter = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'select',
                options: [{
                        id: 'idOption',
                        value: '',
                        color: ''
                    }]
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
            expect(result.value).toEqual('idOption');
        });
        test('should return filterClause propertyId with select template , no option and isNotEmpty clause ', function () {
            var filterClauseIsNotEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status'] });
            var templateFilter = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'select',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
            expect(result.value).toBeFalsy();
        });
        test('should return filterClause propertyId with template, and includes clause with values', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var templateFilter = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter]);
            expect(result.id).toEqual(filterClauseIncludes.propertyId);
            expect(result.value).toEqual(filterClauseIncludes.values[0]);
        });
        test('should return filterClause propertyId with template, and includes clause with no values', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: [] });
            var templateFilter = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter]);
            expect(result.id).toEqual(filterClauseIncludes.propertyId);
            expect(result.value).toBeFalsy();
        });
        test('should return filterClause propertyId with template, and notIncludes clause', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: [] });
            var templateFilter = {
                id: filterClauseNotIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseNotIncludes, [templateFilter]);
            expect(result.id).toEqual(filterClauseNotIncludes.propertyId);
            expect(result.value).toBeFalsy();
        });
        test('should return filterClause propertyId with template, and isEmpty clause', function () {
            var filterClauseIsEmpty = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'isEmpty', values: [] });
            var templateFilter = {
                id: filterClauseIsEmpty.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertyThatMeetsFilterClause(filterClauseIsEmpty, [templateFilter]);
            expect(result.id).toEqual(filterClauseIsEmpty.propertyId);
            expect(result.value).toBeFalsy();
        });
    });
    describe('verify propertiesThatMeetFilterGroup method', function () {
        test('should return {} with undefined filterGroup', function () {
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(undefined, []);
            expect(result).toEqual({});
        });
        test('should return {} with filterGroup without filter', function () {
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: []
            });
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
            expect(result).toEqual({});
        });
        test('should return {} with filterGroup, or operation and no template', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
            expect(result).toEqual({});
        });
        test('should return a result with filterGroup, or operation and template', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseIncludes,
                    filterClause
                ]
            });
            var templateFilter = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter]);
            expect(result).toBeDefined();
            expect(result.propertyId).toEqual(filterClauseIncludes.values[0]);
        });
        test('should return {} with filterGroup, and operation and no template', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
            expect(result).toEqual({});
        });
        test('should return a result with filterGroup, and operation and template', function () {
            var filterClauseIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'includes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause
                ]
            });
            var templateFilter = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: []
            };
            var result = cardFilter_1.CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter]);
            expect(result).toBeDefined();
            expect(result.propertyId).toEqual(filterClauseIncludes.values[0]);
        });
    });
    describe('verify applyFilterGroup method', function () {
        test('should return array with card1', function () {
            var filterClauseNotIncludes = (0, filterClause_1.createFilterClause)({ propertyId: 'propertyId', condition: 'notIncludes', values: ['Status'] });
            var filterGroup = (0, filterGroup_1.createFilterGroup)({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause
                ]
            });
            var result = cardFilter_1.CardFilter.applyFilterGroup(filterGroup, [], [card1]);
            expect(result).toBeDefined();
            expect(result[0]).toEqual(card1);
        });
    });
});
