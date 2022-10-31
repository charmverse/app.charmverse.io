import type { BrandColor } from 'theme/colors';

export type SelectOptionType = {
  id: string;
  name: string;
  color: BrandColor;
  index?: number;
  temp?: boolean;
};

