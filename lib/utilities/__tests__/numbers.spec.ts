import { countValueOccurrences } from '../numbers';

type Fruit = 'banana' | 'watermelon' | 'mango'

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
