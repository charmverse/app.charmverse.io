import { convertFocalboardToMUIColor } from 'components/common/BoardEditor/utils/convertFocalboardToMUIColor';
import { mapMUIColorToProperty } from 'components/common/BoardEditor/utils/mapMUIColorToProperty';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';

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
