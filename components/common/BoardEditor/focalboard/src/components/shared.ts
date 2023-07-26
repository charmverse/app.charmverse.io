export type ReadonlyTitleProp = {
  readonlyTitle?: boolean;
};

export type DisabledAddCardProp = {
  disableAddingCards?: boolean;
};

export type CustomReadonlyViewProps = ReadonlyTitleProp & DisabledAddCardProp;
