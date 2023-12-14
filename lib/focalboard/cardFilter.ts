import { log } from '@charmverse/core/log';

import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { propertyConfigs } from 'lib/focalboard/filterClause';
import type {
  NumberDataTypeConditions,
  FilterClause,
  TextDataTypeConditions,
  BooleanDataTypeConditions,
  MultiSelectDataTypeConditions,
  SelectDataTypeConditions,
  DateDataTypeConditions
} from 'lib/focalboard/filterClause';
import type { FilterGroup } from 'lib/focalboard/filterGroup';
import { isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import { Constants } from './constants';

class CardFilter {
  static applyFilterGroup(filterGroup: FilterGroup, templates: readonly IPropertyTemplate[], cards: Card[]): Card[] {
    const hasTitleProperty = templates.find((o) => o.id === Constants.titleColumnId);
    const cardProperties: readonly IPropertyTemplate[] = hasTitleProperty
      ? templates
      : [...templates, { id: Constants.titleColumnId, name: 'Title', options: [], type: 'text' }];
    return cards.filter((card) => this.isFilterGroupMet(filterGroup, cardProperties, card));
  }

  static isFilterGroupMet(filterGroup: FilterGroup, templates: readonly IPropertyTemplate[], card: Card): boolean {
    const { filters } = filterGroup;
    if (filterGroup.filters.length < 1) {
      return true; // No filters = always met
    }

    if (filterGroup.operation === 'or') {
      for (const filter of filters) {
        if (isAFilterGroupInstance(filter)) {
          if (this.isFilterGroupMet(filter, templates, card)) {
            return true;
          }
        } else if (this.isClauseMet(filter, templates, card)) {
          return true;
        }
      }
      return false;
    }
    Utils.assert(filterGroup.operation === 'and');

    for (const filter of filters) {
      if (isAFilterGroupInstance(filter)) {
        if (!this.isFilterGroupMet(filter, templates, card)) {
          return false;
        }
      } else if (!this.isClauseMet(filter, templates, card)) {
        return false;
      }
    }
    return true;
  }

  static isClauseMet(filter: FilterClause, templates: readonly IPropertyTemplate[], card: Card): boolean {
    const filterProperty = templates.find((o) => o.id === filter.propertyId);
    let value = card.fields.properties[filter.propertyId] ?? [];
    switch (filterProperty?.type) {
      case 'updatedBy': {
        value = card.updatedBy;
        break;
      }
      case 'createdBy': {
        value = card.createdBy;
        break;
      }
      case 'createdTime': {
        value = card.createdAt;
        break;
      }
      case 'updatedTime': {
        value = card.updatedAt;
        break;
      }
      default: {
        break;
      }
    }
    const filterValue = filter.values[0]?.toString()?.toLowerCase() ?? '';
    const valueArray = (Array.isArray(value) ? value : [value]).map((v: string | number | Record<'id', string>) => {
      // In some cases we get an object with an id as value
      if (typeof v === 'object' && 'id' in v) {
        return v.id as string;
      }

      return v.toString();
    });
    if (filterProperty) {
      const filterPropertyDataType = propertyConfigs[filterProperty.type].datatype;
      if (filterPropertyDataType === 'text') {
        const condition = filter.condition as (typeof TextDataTypeConditions)[number];
        const sourceValue = valueArray[0]?.toLowerCase() ?? '';
        switch (condition) {
          case 'contains': {
            if (sourceValue.includes(filterValue)) {
              return true;
            }
            return false;
          }
          case 'does_not_contain': {
            if (!sourceValue.includes(filterValue)) {
              return true;
            }
            return false;
          }
          case 'ends_with': {
            return sourceValue.length === 0 ? true : sourceValue.endsWith(filterValue);
          }
          case 'starts_with': {
            return sourceValue.length === 0 ? true : sourceValue.startsWith(filterValue);
          }
          case 'is': {
            return sourceValue.length === 0 ? true : sourceValue === filterValue;
          }
          case 'is_not': {
            return sourceValue.length === 0 ? true : sourceValue !== filterValue;
          }
          case 'is_empty': {
            return sourceValue === '';
          }
          case 'is_not_empty': {
            return sourceValue !== '';
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      } else if (filterPropertyDataType === 'boolean') {
        const condition = filter.condition as (typeof BooleanDataTypeConditions)[number];
        const sourceValue = valueArray[0]?.toLowerCase() ?? 'false';
        switch (condition) {
          case 'is': {
            return sourceValue === (filter.values[0] || 'false');
          }
          case 'is_not': {
            return sourceValue !== (filter.values[0] || 'false');
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      } else if (filterPropertyDataType === 'number') {
        const condition = filter.condition as (typeof NumberDataTypeConditions)[number];
        const sourceValue = valueArray[0]?.toLowerCase() ?? '';
        switch (condition) {
          case 'equal': {
            return sourceValue.length === 0 ? false : Number(sourceValue) === Number(filterValue);
          }
          case 'greater_than': {
            return sourceValue.length === 0 ? false : Number(sourceValue) > Number(filterValue);
          }
          case 'less_than': {
            return sourceValue.length === 0 ? false : Number(sourceValue) < Number(filterValue);
          }
          case 'less_than_equal': {
            return sourceValue.length === 0 ? false : Number(sourceValue) <= Number(filterValue);
          }
          case 'greater_than_equal': {
            return sourceValue.length === 0 ? false : Number(sourceValue) >= Number(filterValue);
          }
          case 'is_empty': {
            return sourceValue === '';
          }
          case 'is_not_empty': {
            return sourceValue !== '';
          }
          case 'not_equal': {
            return Number(sourceValue) !== Number(filterValue);
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      } else if (filterPropertyDataType === 'multi_select') {
        const condition = filter.condition as (typeof MultiSelectDataTypeConditions)[number];
        switch (condition) {
          case 'contains': {
            return valueArray.length !== 0 && valueArray.some((sourceValue) => filter.values.includes(sourceValue));
          }
          case 'does_not_contain': {
            return valueArray.length === 0
              ? true
              : valueArray.every((sourceValue) => !filter.values.includes(sourceValue));
          }
          case 'is_empty': {
            return valueArray.length === 0;
          }
          case 'is_not_empty': {
            return valueArray.length > 0;
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      } else if (filterPropertyDataType === 'select') {
        const condition = filter.condition as (typeof SelectDataTypeConditions)[number];
        const sourceValue = valueArray[0]?.toLowerCase() ?? '';
        switch (condition) {
          case 'is': {
            return sourceValue.length !== 0 && filterValue === sourceValue;
          }
          case 'is_not': {
            return sourceValue.length === 0 ? true : filterValue !== sourceValue;
          }
          case 'is_empty': {
            return sourceValue === '';
          }
          case 'is_not_empty': {
            return sourceValue !== '';
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      } else if (filterPropertyDataType === 'date') {
        const condition = filter.condition as (typeof DateDataTypeConditions)[number];
        const propertyValue = valueArray[0];
        let sourceValue: { from?: number } = {};
        try {
          // property value would be a valid number if its createdTime or updatedTime
          // For custom date properties, it would be stringified object
          sourceValue = !Number.isNaN(Number(propertyValue))
            ? { from: Number(propertyValue) }
            : typeof propertyValue === 'string'
            ? (JSON.parse(propertyValue) as { from: number })
            : { from: undefined };
        } catch (error) {
          log.error('Could not parse card property value', { propertyValue, error });
        }

        switch (condition) {
          case 'is': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() === new Date(sourceValue.from).getTime()
            );
          }
          case 'is_before': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() > new Date(sourceValue.from).getTime()
            );
          }
          case 'is_after': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() < new Date(sourceValue.from).getTime()
            );
          }
          case 'is_empty': {
            return sourceValue.from === undefined;
          }
          case 'is_not': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() !== new Date(sourceValue.from).getTime()
            );
          }
          case 'is_not_empty': {
            return sourceValue.from !== undefined;
          }
          case 'is_on_or_after': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() <= new Date(sourceValue.from).getTime()
            );
          }
          case 'is_on_or_before': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() >= new Date(sourceValue.from).getTime()
            );
          }
          default: {
            Utils.assertFailure(`Invalid filter condition: ${filter.condition} for type ${filterPropertyDataType}`);
          }
        }
      }
      return true;
    }

    return true;
  }

  static propertiesThatMeetFilterGroup(
    filterGroup: FilterGroup | undefined,
    templates: readonly IPropertyTemplate[]
  ): Record<string, string | string[]> {
    // TODO: Handle filter groups
    if (!filterGroup) {
      return {};
    }

    const filters = filterGroup.filters.filter((o) => !isAFilterGroupInstance(o));
    if (filters.length < 1) {
      return {};
    }

    if (filterGroup.operation === 'or') {
      // Just need to meet the first clause
      const property = this.propertyThatMeetsFilterClause(filters[0] as FilterClause, templates);
      const result: Record<string, string | string[]> = {};
      if (property.value) {
        result[property.id] = property.value;
      }
      return result;
    }

    // And: Need to meet all clauses
    const result: Record<string, string | string[]> = {};
    filters.forEach((filterClause) => {
      const property = this.propertyThatMeetsFilterClause(filterClause as FilterClause, templates);
      if (property.value) {
        result[property.id] = property.value;
      }
    });
    return result;
  }

  static propertyThatMeetsFilterClause(
    filterClause: FilterClause,
    templates: readonly IPropertyTemplate[]
  ): { id: string; value?: string | string[] } {
    const filterProperty = templates.find((o) => o.id === filterClause.propertyId);
    if (filterProperty) {
      const filterPropertyDataType = propertyConfigs[filterProperty.type].datatype;

      if (filterPropertyDataType === 'text') {
        const condition = filterClause.condition as (typeof TextDataTypeConditions)[number];
        switch (condition) {
          case 'contains':
          case 'ends_with':
          case 'is':
          case 'starts_with':
          case 'is_not_empty': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'does_not_contain':
          case 'is_not':
          case 'is_empty': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Unexpected filter condition: ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'boolean') {
        const condition = filterClause.condition as (typeof BooleanDataTypeConditions)[number];
        switch (condition) {
          case 'is': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'is_not': {
            return { id: filterClause.propertyId, value: filterClause.values[0] === 'true' ? 'false' : 'true' };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'number') {
        const condition = filterClause.condition as (typeof NumberDataTypeConditions)[number];
        switch (condition) {
          case 'equal':
          case 'greater_than_equal':
          case 'less_than_equal':
          case 'is_not_empty': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'greater_than': {
            return { id: filterClause.propertyId, value: String(Number(filterClause.values[0]) + 1) };
          }
          case 'less_than': {
            return { id: filterClause.propertyId, value: String(Number(filterClause.values[0]) - 1) };
          }
          case 'is_empty':
          case 'not_equal': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'multi_select') {
        const condition = filterClause.condition as (typeof MultiSelectDataTypeConditions)[number];
        switch (condition) {
          case 'contains':
          case 'is_not_empty': {
            if (filterProperty.type === 'person') {
              return {
                id: filterClause.propertyId,
                value: filterClause.values
              };
            }
            return {
              id: filterClause.propertyId,
              value: filterClause.values.filter((filterValue) =>
                filterProperty.options.find((option) => option.id === filterValue)
              )
            };
          }
          case 'does_not_contain':
          case 'is_empty': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'select') {
        const condition = filterClause.condition as (typeof SelectDataTypeConditions)[number];
        switch (condition) {
          case 'is':
          case 'is_not_empty': {
            return {
              id: filterClause.propertyId,
              value: filterProperty.options.find((option) => option.id === filterClause.values[0])
                ? [filterClause.values[0]]
                : []
            };
          }
          case 'is_not':
          case 'is_empty': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'date') {
        const condition = filterClause.condition as (typeof DateDataTypeConditions)[number];
        switch (condition) {
          case 'is':
          case 'is_not_empty':
          case 'is_on_or_after':
          case 'is_on_or_before': {
            return { id: filterClause.propertyId, value: JSON.stringify({ from: Number(filterClause.values[0]) }) };
          }
          case 'is_before': {
            return {
              id: filterClause.propertyId,
              value: JSON.stringify({
                from: new Date(Number(filterClause.values[0])).getTime() - 86_400_000
              })
            };
          }
          case 'is_after': {
            return {
              id: filterClause.propertyId,
              value: JSON.stringify({
                from: new Date(Number(filterClause.values[0])).getTime() + 86_400_000
              })
            };
          }
          case 'is_empty':
          case 'is_not': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      }
    } else {
      Utils.assertFailure(`propertyThatMeetsFilterClause. Cannot find template: ${filterClause.propertyId}`);
      return { id: filterClause.propertyId };
    }

    return { id: filterClause.propertyId };
  }
}

export { CardFilter };
