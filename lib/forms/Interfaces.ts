export type NewSelectOptionType = {
  id?: string;
  index?: number;
  name: string;
  color: string;
};

export type ExistingSelectOption = NewSelectOptionType & {
  id: string;
};
