
import { getGroupsWithOperations } from '../mapping';

describe('getGroupsWithOperations', () => {
  it('should return only the groups that can perform all requested operations', () => {
    let result = getGroupsWithOperations(['work']);

    expect(result.length).toBe(1);
    expect(result.includes('submitter')).toBe(true);

    result = getGroupsWithOperations(['review']);

    expect(result.length).toBe(2);
    expect(result.includes('creator'));
    expect(result.includes('reviewer'));
  });

  it('should return an empty array if no group has all target operations', () => {
    const result = getGroupsWithOperations(['view', 'work', 'inexistent-op' as any]);

    expect(result).toEqual([]);
  });
});
