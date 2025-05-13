import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';

import type { IPropertyOption } from '@packages/databases/board';

import { convertFocalboardToMUIColor } from '../../../utils/convertFocalboardToMUIColor';
import { mapMUIColorToProperty } from '../../../utils/mapMUIColorToProperty';

export function mapSelectOptionToPropertyOption(option: SelectOptionType): IPropertyOption {
  return {
    id: option.id,
    value: option.name,
    dropdownValue: option.dropdownName,
    color: mapMUIColorToProperty(option.color),
    disabled: option.disabled
  };
}

export function mapPropertyOptionToSelectOption(option: IPropertyOption): SelectOptionType {
  return {
    id: option.id,
    name: option.value,
    variant: option.variant,
    dropdownName: option.dropdownValue,
    color: convertFocalboardToMUIColor(option.color),
    disabled: option.disabled
  };
}

export function mapValueToSelectOption(value: string): SelectOptionType {
  return {
    id: value,
    name: value,
    color: 'default'
    // variant: option.variant,
    // dropdownName: option.dropdownValue,
    // color: convertFocalboardToMUIColor(option.color)
    // disabled: option.disabled
  };
}
