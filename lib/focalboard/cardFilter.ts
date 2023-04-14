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

class CardFilter {
  static applyFilterGroup(filterGroup: FilterGroup, templates: readonly IPropertyTemplate[], cards: Card[]): Card[] {
    return cards.filter((card) => this.isFilterGroupMet(filterGroup, templates, card));
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
    const value = card.fields.properties[filter.propertyId] ?? [];
    const filterProperty = templates.find((o) => o.id === filter.propertyId);
    const filterValue = filter.values[0]?.toLowerCase() ?? '';
    if (filterProperty) {
      const filterPropertyDataType = propertyConfigs[filterProperty.type].datatype;

      if (filterPropertyDataType === 'text') {
        const condition = filter.condition as (typeof TextDataTypeConditions)[number];
        const sourceValue = (Array.isArray(value) ? value[0] : value)?.toLowerCase() ?? '';
        switch (condition) {
          case 'contains': {
            if (sourceValue.includes(filterValue)) {
              return true;
            }
            return false;
          }
          case 'does-not-contain': {
            if (!sourceValue.includes(filterValue)) {
              return true;
            }
            return false;
          }
          case 'ends-with': {
            return sourceValue.endsWith(filterValue);
          }
          case 'starts-with': {
            return sourceValue.startsWith(filterValue);
          }
          case 'is': {
            return sourceValue === filterValue;
          }
          case 'is-not': {
            return sourceValue !== filterValue;
          }
          case 'is-empty': {
            return sourceValue === '';
          }
          case 'is-not-empty': {
            return sourceValue !== '';
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
          }
        }
      } else if (filterPropertyDataType === 'boolean') {
        const condition = filter.condition as (typeof BooleanDataTypeConditions)[number];
        const sourceValue = (Array.isArray(value) ? value[0] : value)?.toLowerCase() ?? 'false';

        switch (condition) {
          case 'is': {
            return sourceValue === filterValue;
          }
          case 'is-not': {
            return sourceValue !== filterValue;
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
          }
        }
      } else if (filterPropertyDataType === 'number') {
        const condition = filter.condition as (typeof NumberDataTypeConditions)[number];
        const sourceValue = (Array.isArray(value) ? value[0] : value)?.toLowerCase() ?? '0';
        switch (condition) {
          case 'equal': {
            return Number(sourceValue) === Number(filterValue);
          }
          case 'greater-than': {
            return Number(sourceValue) > Number(filterValue);
          }
          case 'less-than': {
            return Number(sourceValue) < Number(filterValue);
          }
          case 'less-than-equal': {
            return Number(sourceValue) <= Number(filterValue);
          }
          case 'greater-than-equal': {
            return Number(sourceValue) >= Number(filterValue);
          }
          case 'is-empty': {
            return sourceValue === '';
          }
          case 'is-not-empty': {
            return sourceValue !== '';
          }
          case 'not-equal': {
            return Number(sourceValue) !== Number(filterValue);
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
          }
        }
      } else if (filterPropertyDataType === 'multi-select') {
        const condition = filter.condition as (typeof MultiSelectDataTypeConditions)[number];
        const sourceValues = value as string[];
        switch (condition) {
          case 'contains': {
            return sourceValues.some((sourceValue) => filter.values.includes(sourceValue));
          }
          case 'does-not-contain': {
            return sourceValues.every((sourceValue) => !filter.values.includes(sourceValue));
          }
          case 'is-empty': {
            return sourceValues.length === 0;
          }
          case 'is-not-empty': {
            return sourceValues.length > 0;
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
          }
        }
      } else if (filterPropertyDataType === 'select') {
        const condition = filter.condition as (typeof SelectDataTypeConditions)[number];
        const sourceValue = (Array.isArray(value) ? value[0] : value)?.toLowerCase() ?? '';
        switch (condition) {
          case 'is': {
            return filterValue === sourceValue;
          }
          case 'is-not': {
            return filterValue !== sourceValue;
          }
          case 'is-empty': {
            return sourceValue === '';
          }
          case 'is-not-empty': {
            return sourceValue !== '';
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
          }
        }
      } else if (filterPropertyDataType === 'date') {
        const condition = filter.condition as (typeof DateDataTypeConditions)[number];
        const propertyValue = Array.isArray(value) ? value[0] : value;
        const sourceValue = propertyValue ? (JSON.parse(propertyValue) as { from: number }) : { from: undefined };
        switch (condition) {
          case 'is': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() === new Date(sourceValue.from).getTime()
            );
          }
          case 'is-before': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() > new Date(sourceValue.from).getTime()
            );
          }
          case 'is-after': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() < new Date(sourceValue.from).getTime()
            );
          }
          case 'is-empty': {
            return sourceValue.from === undefined;
          }
          case 'is-not': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() !== new Date(sourceValue.from).getTime()
            );
          }
          case 'is-not-empty': {
            return sourceValue.from !== undefined;
          }
          case 'is-on-or-after': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() <= new Date(sourceValue.from).getTime()
            );
          }
          case 'is-on-or-before': {
            return (
              sourceValue.from !== undefined &&
              new Date(Number(filterValue)).getTime() >= new Date(sourceValue.from).getTime()
            );
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`);
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
    const template = templates.find((o) => o.id === filterClause.propertyId);
    if (!template) {
      Utils.assertFailure(`propertyThatMeetsFilterClause. Cannot find template: ${filterClause.propertyId}`);
      return { id: filterClause.propertyId };
    }
    const filterProperty = templates.find((o) => o.id === filterClause.propertyId);
    if (filterProperty) {
      const filterPropertyDataType = propertyConfigs[filterProperty.type].datatype;

      if (filterPropertyDataType === 'text') {
        const condition = filterClause.condition as (typeof TextDataTypeConditions)[number];
        switch (condition) {
          case 'contains':
          case 'ends-with':
          case 'is':
          case 'starts-with':
          case 'is-not-empty': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'does-not-contain':
          case 'is-not':
          case 'is-empty': {
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
          case 'is-not': {
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
          case 'greater-than-equal':
          case 'less-than-equal':
          case 'is-not-empty': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'greater-than': {
            return { id: filterClause.propertyId, value: String(Number(filterClause.values[0]) + 1) };
          }
          case 'less-than': {
            return { id: filterClause.propertyId, value: String(Number(filterClause.values[0]) - 1) };
          }
          case 'is-empty':
          case 'not-equal': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      } else if (filterPropertyDataType === 'multi-select') {
        const condition = filterClause.condition as (typeof MultiSelectDataTypeConditions)[number];
        switch (condition) {
          case 'contains':
          case 'is-not-empty': {
            return { id: filterClause.propertyId, value: [filterClause.values[0]] };
          }
          case 'does-not-contain':
          case 'is-empty': {
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
          case 'is-not-empty': {
            return { id: filterClause.propertyId, value: filterClause.values[0] };
          }
          case 'is-not':
          case 'is-empty': {
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
          case 'is-not-empty':
          case 'is-on-or-after':
          case 'is-on-or-before': {
            return { id: filterClause.propertyId, value: JSON.stringify({ from: Number(filterClause.values[0]) }) };
          }
          case 'is-before': {
            return {
              id: filterClause.propertyId,
              value: JSON.stringify({
                from: new Date(Number(filterClause.values[0])).getTime() - 86_400_000
              })
            };
          }
          case 'is-after': {
            return {
              id: filterClause.propertyId,
              value: JSON.stringify({
                from: new Date(Number(filterClause.values[0])).getTime() + 86_400_000
              })
            };
          }
          case 'is-empty':
          case 'is-not': {
            return { id: filterClause.propertyId };
          }
          default: {
            Utils.assertFailure(`Invalid filter condition ${filterClause.condition}`);
            return { id: filterClause.propertyId };
          }
        }
      }
    }

    return { id: filterClause.propertyId };
  }
}

export { CardFilter };
