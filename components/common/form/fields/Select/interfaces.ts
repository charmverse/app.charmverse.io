import type { SupportedColor } from 'theme/colors';

export type SelectOptionType = {
  id: string;
  name: string;
  color: SupportedColor;
  disabled?: boolean;
  dropdownName?: string;
  index?: number;
  temp?: boolean;
  variant?: 'chip' | 'plain';
};
