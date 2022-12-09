import { convertFocalboardToMUIColor } from 'components/common/BoardEditor/utils/convertFocalboardToMUIColor';
import { mapMUIColorToProperty } from 'components/common/BoardEditor/utils/mapMUIColorToProperty';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';

export function mapSelectOptionToPropertyOption(option: SelectOptionType): IPropertyOption {
  return {
    id: option.id,
    value: option.name,
    color: mapMUIColorToProperty(option.color)
  };
}

export function mapPropertyOptionToSelectOption(option: IPropertyOption): SelectOptionType {
  return {
    id: option.id,
    name: option.value,
    color: convertFocalboardToMUIColor(option.color)
  };
}
