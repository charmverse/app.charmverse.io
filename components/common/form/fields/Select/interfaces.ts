import type { ExistingSelectOption, NewSelectOptionType } from 'lib/forms/Interfaces';
import type { BrandColor } from 'theme/colors';

export type TempSelectOption = NewSelectOptionType & {
  inputValue: string;
}

export type SelectOptionType = (ExistingSelectOption | TempSelectOption) & { color: BrandColor };

