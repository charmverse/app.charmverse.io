import type { SupportedColor } from 'theme/colors';

export type SelectOptionType = {
  id: string;
  name: string;
  color: SupportedColor;
  index?: number;
  temp?: boolean;
};
