import type { BrandColor } from 'theme/colors';

export type NewSelectOptionType = {
  id?: string;
  index?: number;
  name: string;
  color: BrandColor;
};

export type TempSelectOption = NewSelectOptionType & {
  id: string;
}

export type ExistingSelectOption = NewSelectOptionType & {
  inputValue: string;
}

export type SelectOptionType = ExistingSelectOption | TempSelectOption;

