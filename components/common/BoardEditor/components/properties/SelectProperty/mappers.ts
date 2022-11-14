import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';
import { getPropertyColorName } from 'theme/utils/getPropertyColorName';
import { getThemeColorFromString } from 'theme/utils/getThemeColorFromString';

export function mapSelectOptionToPropertyOption (option: SelectOptionType): IPropertyOption {
  return {
    id: option.id,
    value: option.name,
    color: getPropertyColorName(option.color)
  };
}

export function mapPropertyOptionToSelectOption (option: IPropertyOption): SelectOptionType {
  return {
    id: option.id,
    name: option.value,
    color: getThemeColorFromString(option.color)
  };
}
