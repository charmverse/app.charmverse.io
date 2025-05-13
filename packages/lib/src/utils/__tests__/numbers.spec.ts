import { countValueOccurrences, nanofy, percent, roundNumberInRange } from '../numbers';

type Fruit = 'banana' | 'watermelon' | 'mango';

describe('countValueOccurrences', () => {
  const testData: Record<'fruit', Fruit>[] = [
    {
      fruit: 'banana'
    },
    {
      fruit: 'mango'
    },
    {
      fruit: 'banana'
    }
  ];

  const counted = countValueOccurrences<Fruit>(testData, 'fruit');

  it('should return the correct count for each data occurrences', () => {
    expect(counted.banana).toBe(2);
    expect(counted.mango).toBe(1);
  });

  it('should return undefined if a value in types occurrs 0 times', () => {
    expect(counted.watermelon).toBeUndefined();
  });

  it('should return a matching breakdown and total', () => {
    expect(counted.total).toBe(3);
  });
});

describe('nanofy', () => {
  it('should return the number if it is equal to or above 1', () => {
    const above1 = 1.0033454;

    expect(nanofy({ number: above1 })).toEqual(above1.toString());
    expect(nanofy({ number: 1 })).toEqual('1');
  });

  it('should return the 3 most significant digits with the correct unit, and a space if this parameter is provided', () => {
    const milliNum = 0.99722345;
    const microNum = milliNum / 1000;
    const nanoNum = microNum / 1000;
    const picoNum = nanoNum / 1000;
    const femtoNum = picoNum / 1000;
    const attoNum = femtoNum / 1000;

    expect(nanofy({ number: milliNum })).toBe('997m');

    expect(nanofy({ number: microNum, spaceUnit: true })).toBe('997 µ');

    // Don't provide spaceUnit to check that the default false behaviour is respected
    expect(nanofy({ number: nanoNum })).toBe('997n');

    expect(nanofy({ number: picoNum, spaceUnit: true })).toBe('997 p');

    expect(nanofy({ number: femtoNum, spaceUnit: false })).toBe('997f');

    expect(nanofy({ number: attoNum, spaceUnit: true })).toBe('997 a');
  });

  it('should work when the first decimal is 0', () => {
    const milliNum = 0.099722;
    const microNum = milliNum / 1000;
    const nanoNum = microNum / 1000;
    const picoNum = nanoNum / 1000;
    const femtoNum = picoNum / 1000;
    const attoNum = femtoNum / 1000;

    expect(nanofy({ number: milliNum })).toBe('99.7m');

    expect(nanofy({ number: microNum, spaceUnit: true })).toBe('99.7 µ');

    // Don't provide spaceUnit to check that the default false behaviour is respected
    expect(nanofy({ number: nanoNum })).toBe('99.7n');

    expect(nanofy({ number: picoNum, spaceUnit: true })).toBe('99.7 p');

    expect(nanofy({ number: femtoNum, spaceUnit: false })).toBe('99.7f');

    expect(nanofy({ number: attoNum, spaceUnit: true })).toBe('99.7 a');

    const numberWithZero = 0.0090004;
    expect(nanofy({ number: numberWithZero })).toBe('9m');
  });

  it('should work when the first and second decimal is 0', () => {
    const milliNum = 0.0099722;
    const microNum = milliNum / 1000;
    const nanoNum = microNum / 1000;
    const picoNum = nanoNum / 1000;
    const femtoNum = picoNum / 1000;
    const attoNum = femtoNum / 1000;

    expect(nanofy({ number: milliNum })).toBe('9.97m');

    expect(nanofy({ number: microNum, spaceUnit: true })).toBe('9.97 µ');

    // Don't provide spaceUnit to check that the default false behaviour is respected
    expect(nanofy({ number: nanoNum })).toBe('9.97n');

    expect(nanofy({ number: picoNum, spaceUnit: true })).toBe('9.97 p');

    expect(nanofy({ number: femtoNum, spaceUnit: false })).toBe('9.97f');

    expect(nanofy({ number: attoNum, spaceUnit: true })).toBe('9.97 a');

    const numberWithZero = 0.0090004;
    expect(nanofy({ number: numberWithZero })).toBe('9m');
  });
});

describe('percent', () => {
  it('should return a percentage with the correct amount of significant digits, with a default of 0', () => {
    expect(percent({ value: 50, total: 100 })).toBe('50%');
    expect(percent({ value: 50, total: 100, significantDigits: 1 })).toBe('50.0%');
    expect(percent({ value: 1 / 3, total: 1, significantDigits: 3 })).toBe('33.333%');
  });
});

describe('roundNumberInRange', () => {
  it('should return the rounded number if it is within the range', () => {
    expect(roundNumberInRange({ num: 5.2, min: 1, max: 10 })).toBe(5);
  });

  it('should return the minimum value if the number is below the range', () => {
    expect(roundNumberInRange({ num: -1.5, min: 1, max: 10 })).toBe(1);
  });

  it('should return the maximum value if the number is above the range', () => {
    expect(roundNumberInRange({ num: 15.23, min: 1, max: 10 })).toBe(10);
  });

  it('should handle edge case where num is equal to min', () => {
    expect(roundNumberInRange({ num: 1, min: 1, max: 10 })).toBe(1);
  });

  it('should handle edge case where num is equal to max', () => {
    expect(roundNumberInRange({ num: 10, min: 1, max: 10 })).toBe(10);
  });
});
