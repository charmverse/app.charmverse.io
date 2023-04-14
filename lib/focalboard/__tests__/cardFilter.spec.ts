import { v4 } from 'uuid';

import { TestBlockFactory } from 'components/common/BoardEditor/focalboard/src/test/testBlockFactory';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createFilterClause } from 'lib/focalboard/filterClause';
import { createFilterGroup } from 'lib/focalboard/filterGroup';

import { CardFilter } from '../cardFilter';

jest.mock('components/common/BoardEditor/focalboard/src/utils');
const mockedUtils = jest.mocked(Utils, true);
describe('src/cardFilter', () => {
  const board = TestBlockFactory.createBoard();
  board.id = '1';
  board.rootId = '1';
  const card1 = TestBlockFactory.createCard(board);
  card1.id = '1';
  card1.title = 'card1';
  card1.fields.properties.propertyId = 'Status';
  const filterClause = createFilterClause({
    propertyId: 'propertyId',
    condition: 'is-not-empty',
    values: ['Status'],
    filterId: v4()
  });
  describe('verify isClauseMet method', () => {
    test('should be true with is-not-empty clause', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(filterClauseIsNotEmpty, [], card1);
      expect(result).toBeTruthy();
    });
    test('should be false with is-empty clause', () => {
      const filterClauseIsEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-empty',
        values: [],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(
        filterClauseIsEmpty,
        [{ id: 'propertyId', name: 'Property', options: [], type: 'select' }],
        card1
      );
      expect(result).toBeFalsy();
    });
    test('should be true with contains clause', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(filterClauseIncludes, [], card1);
      expect(result).toBeTruthy();
    });
    test('should be true with contains and no values clauses', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: [],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(filterClauseIncludes, [], card1);
      expect(result).toBeTruthy();
    });
    test('should be false with does not contain clause', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(filterClauseNotIncludes, [], card1);
      expect(result).toBeFalsy();
    });
    test('should be true with does not contain and no values clauses', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: [],
        filterId: v4()
      });
      const result = CardFilter.isClauseMet(filterClauseNotIncludes, [], card1);
      expect(result).toBeTruthy();
    });
  });
  describe('verify isFilterGroupMet method', () => {
    test('should return true with no filter', () => {
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: []
      });
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeTruthy();
    });
    test('should return true with or operation and 2 filterCause, one is false ', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClause]
      });
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeTruthy();
    });
    test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroupInFilterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClause]
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: []
      });
      filterGroup.filters.push(filterGroupInFilterGroup);
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeTruthy();
    });
    test('should return false with or operation and two filterCause, two are false ', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterClauseEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-empty',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClauseEmpty]
      });
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeFalsy();
    });
    test('should return false with and operation and 2 filterCause, one is false ', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClause]
      });
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeFalsy();
    });
    test('should return true with and operation and 2 filterCause, two are true ', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIncludes, filterClause]
      });
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeTruthy();
    });
    test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroupInFilterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClause]
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: []
      });
      filterGroup.filters.push(filterGroupInFilterGroup);
      const result = CardFilter.isFilterGroupMet(filterGroup, [], card1);
      expect(result).toBeFalsy();
    });
  });
  describe('verify propertyThatMeetsFilterClause method', () => {
    test('should return Utils.assertFailure and filterClause propertyId ', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, []);
      expect(mockedUtils.assertFailure).toBeCalledTimes(1);
      expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
    });
    test('should return filterClause propertyId with non-select template and is-not-empty clause ', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIsNotEmpty.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
      expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
      expect(result.value).toBeFalsy();
    });
    test('should return filterClause propertyId with select template , an option and is-not-empty clause ', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIsNotEmpty.propertyId,
        name: 'template',
        type: 'select',
        options: [
          {
            id: 'idOption',
            value: '',
            color: ''
          }
        ]
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
      expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
      expect(result.value).toEqual('idOption');
    });
    test('should return filterClause propertyId with select template , no option and is-not-empty clause ', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIsNotEmpty.propertyId,
        name: 'template',
        type: 'select',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter]);
      expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId);
      expect(result.value).toBeFalsy();
    });

    test('should return filterClause propertyId with template, and contains clause with values', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIncludes.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter]);
      expect(result.id).toEqual(filterClauseIncludes.propertyId);
      expect(result.value).toEqual(filterClauseIncludes.values[0]);
    });
    test('should return filterClause propertyId with template, and contains clause with no values', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: [],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIncludes.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter]);
      expect(result.id).toEqual(filterClauseIncludes.propertyId);
      expect(result.value).toBeFalsy();
    });
    test('should return filterClause propertyId with template, and does not contain clause', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: [],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseNotIncludes.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseNotIncludes, [templateFilter]);
      expect(result.id).toEqual(filterClauseNotIncludes.propertyId);
      expect(result.value).toBeFalsy();
    });
    test('should return filterClause propertyId with template, and is-empty clause', () => {
      const filterClauseIsEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-empty',
        values: [],
        filterId: v4()
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIsEmpty.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsEmpty, [templateFilter]);
      expect(result.id).toEqual(filterClauseIsEmpty.propertyId);
      expect(result.value).toBeFalsy();
    });

    test('should return a result with filterGroup for is-not-empty', () => {
      const filterClauseIsNotEmpty = createFilterClause({
        propertyId: 'propertyId',
        condition: 'is-not-empty',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIsNotEmpty]
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClause.propertyId,
        name: 'template',
        type: 'multiSelect',
        options: [
          {
            id: 'idOption',
            value: '',
            color: ''
          }
        ]
      };
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter]);
      expect(result).toBeDefined();
      expect(result.propertyId).toEqual(templateFilter.options[0].id);
    });
  });
  describe('verify propertiesThatMeetFilterGroup method', () => {
    test('should return {} with undefined filterGroup', () => {
      const result = CardFilter.propertiesThatMeetFilterGroup(undefined, []);
      expect(result).toEqual({});
    });
    test('should return {} with filterGroup without filter', () => {
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: []
      });
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
      expect(result).toEqual({});
    });
    test('should return {} with filterGroup, or operation and no template', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIncludes, filterClause]
      });
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
      expect(result).toEqual({});
    });
    test('should return a result with filterGroup, or operation and template', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIncludes, filterClause]
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIncludes.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter]);
      expect(result).toBeDefined();
      expect(result.propertyId).toEqual(filterClauseIncludes.values[0]);
    });
    test('should return {} with filterGroup, and operation and no template', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIncludes, filterClause]
      });
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, []);
      expect(result).toEqual({});
    });

    test('should return a result with filterGroup, and operation and template', () => {
      const filterClauseIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'contains',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseIncludes, filterClause]
      });
      const templateFilter: IPropertyTemplate = {
        id: filterClauseIncludes.propertyId,
        name: 'template',
        type: 'text',
        options: []
      };
      const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter]);
      expect(result).toBeDefined();
      expect(result.propertyId).toEqual(filterClauseIncludes.values[0]);
    });
  });
  describe('verify applyFilterGroup method', () => {
    test('should return array with card1', () => {
      const filterClauseNotIncludes = createFilterClause({
        propertyId: 'propertyId',
        condition: 'does-not-contain',
        values: ['Status'],
        filterId: v4()
      });
      const filterGroup = createFilterGroup({
        operation: 'and',
        filters: [filterClauseNotIncludes, filterClause]
      });
      const result = CardFilter.applyFilterGroup(filterGroup, [], [card1]);
      expect(result).toBeDefined();
      expect(result[0]).toEqual(card1);
    });
  });
});
