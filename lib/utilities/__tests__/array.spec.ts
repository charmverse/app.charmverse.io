import { uniqueValues, sortArrayByObjectProperty } from '../array';

describe('uniqueValues', () => {
  it('should only return unique values', () => {

    const testValue = [1, 1, 1, 2];

    const uniqueElements = uniqueValues(testValue);

    expect(uniqueElements.length).toBe(2);
  });
});

describe('sortArrayByObjectProperty', () => {

  const ordering = ['first', 'second', 'third'];

  const values = [

    {
      prop: 'third'
    },
    {
      prop: 'second'
    },
    {
      prop: undefined
    },
    {
      prop: 'first'
    }

  ];

  // fourth is not defined
  const valuesWithInexistentOrdering = [

    {
      prop: 'third'
    },
    {
      prop: 'second'
    },
    {
      prop: undefined
    },
    {
      prop: 'first'
    },
    {
      prop: 'fourth'
    }
  ];

  it('should order an array of objects, using the order of a property in a separate array', () => {

    const sorted = sortArrayByObjectProperty(values, 'prop', ordering);

    expect(sorted[0].prop).toBe('first');
    expect(sorted[1].prop).toBe('second');
    expect(sorted[2].prop).toBe('third');
    expect(sorted[3].prop).toBe(undefined);
  });

  it('should move items whose value is not in the ordering to the end of the array', () => {

    const sorted = sortArrayByObjectProperty(valuesWithInexistentOrdering, 'prop', ordering);

    expect(sorted.slice(3).some(item => item.prop === 'fourth')).toBe(true);
    expect(sorted.slice(3).some(item => item.prop === undefined)).toBe(true);
  });
});
