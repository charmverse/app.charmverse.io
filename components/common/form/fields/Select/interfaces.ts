import type { SupportedColor } from 'theme/colors';

export type SelectOptionType = {
  id: string;
  name: string;
  color: SupportedColor;
  disabled?: boolean;
  index?: number;
  temp?: boolean;
};
