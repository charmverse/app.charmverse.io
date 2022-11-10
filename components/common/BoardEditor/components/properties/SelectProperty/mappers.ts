import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';
import { getThemeColorFromString } from 'theme/utils/getThemeColorFromString';

export function mapSelectOptionToPropertyOption (option: SelectOptionType): IPropertyOption {
  return {
    id: option.id,
    value: option.name,
    color: option.color as string
  };
}

export function mapPropertyOptionToSelectOption (option: IPropertyOption): SelectOptionType {
  return {
    id: option.id,
    name: option.value,
    color: getThemeColorFromString(option.color)
  };
}
