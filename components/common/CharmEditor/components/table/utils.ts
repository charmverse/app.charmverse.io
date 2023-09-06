export type CellAttrs = {
  colspan: number;
  rowspan: number;
  colwidth: number[] | null;
};

export const sortCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});

export const sortNumVsString = (direction: number, textA: string, textB: string, collator?: Intl.Collator) => {
  // give first priority to numbers - so if only one content is numeric he will always be first
  const aNumber = parseFloat(textA);
  const bNumber = parseFloat(textB);

  const aIsNotNumber = Number.isNaN(aNumber);
  const bIsNotNumber = Number.isNaN(bNumber);

  if (aIsNotNumber && bIsNotNumber) {
    // if not numeric values sort alphabetically
    return direction * (collator || sortCollator).compare(textA, textB);
  }

  if (!aIsNotNumber && bIsNotNumber) return -1 * direction;
  if (aIsNotNumber && !bIsNotNumber) return 1 * direction;
  return direction > 0 ? aNumber - bNumber : bNumber - aNumber;
};

export const createElementWithClass = (type: string, className: string, datatest?: string) => {
  const el = document.createElement(type);
  el.className = className;
  if (datatest) {
    el.dataset.test = datatest;
  }

  return el;
};
