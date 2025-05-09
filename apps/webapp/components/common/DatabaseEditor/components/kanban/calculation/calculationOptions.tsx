import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';

import type { CommonCalculationOptionProps } from '../../calculations/options';
import { CalculationOptions, optionsByType } from '../../calculations/options';

import type { OptionProps } from './kanbanOption';
import { Option } from './kanbanOption';

type Props = CommonCalculationOptionProps & {
  cardProperties: IPropertyTemplate[];
  onChange: (data: { calculation: string; propertyId: string }) => void;
  property: IPropertyTemplate;
  anchorEl: HTMLElement | null;
};

// contains mapping of property types which are effectly the same as other property type.
const equivalentPropertyType = new Map<PropertyType, PropertyType>([
  ['createdTime', 'date'],
  ['updatedTime', 'date']
]);

export function getEquivalentPropertyType(propertyType: PropertyType): PropertyType {
  return equivalentPropertyType.get(propertyType) || propertyType;
}

export function KanbanCalculationOptions(props: Props): JSX.Element {
  const options: OptionProps[] = [];

  // Show common options, first,
  // followed by type-specific functions
  optionsByType.get('common')!.forEach((typeOption) => {
    if (typeOption.value !== 'none') {
      options.push({
        ...typeOption,
        cardProperties: props.cardProperties,
        onChange: props.onChange,
        activeValue: props.value,
        activeProperty: props.property
      });
    }
  });

  const seen: Record<string, boolean> = {};
  props.cardProperties.forEach((property) => {
    // skip already processed property types
    if (seen[getEquivalentPropertyType(property.type)]) {
      return;
    }

    (optionsByType.get(property.type) || []).forEach((typeOption) => {
      options.push({
        ...typeOption,
        cardProperties: props.cardProperties,
        onChange: props.onChange,
        activeValue: props.value,
        activeProperty: props.property!
      });
    });

    seen[getEquivalentPropertyType(property.type)] = true;
  });

  return (
    <CalculationOptions
      value={props.value}
      menuOpen={props.menuOpen}
      onClose={props.onClose}
      // onChange={props.onChange}
      options={options}
      anchorEl={props.anchorEl}
      menuItemComponent={Option}
    />
  );
}
