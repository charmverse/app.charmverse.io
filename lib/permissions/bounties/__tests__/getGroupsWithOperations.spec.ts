
import { getGroupsWithOperations } from '../mapping';

describe('getGroupsWithOperations', () => {
  it('should return only the groups that can perform all requested operations', () => {
    let result = getGroupsWithOperations(['view', 'work']);

    expect(result.length).toBe(1);
    expect(result[0]).toBe('submitter');

    result = getGroupsWithOperations(['view']);

    expect(result.length).toBe(4);
    expect(result.includes('creator'));
    expect(result.includes('reviewer'));
    expect(result.includes('submitter'));
    expect(result.includes('viewer'));

  });

  it('should return an empty array if no group has all target operations', () => {
    const result = getGroupsWithOperations(['view', 'work', 'inexistent-op' as any]);

    expect(result).toEqual([]);
  });
});
