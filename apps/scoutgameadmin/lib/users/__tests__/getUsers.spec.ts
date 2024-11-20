import { mockScout, mockBuilder } from '@packages/scoutgame/testing/database';

import { getUsers } from '../getUsers';

describe('getUsers', () => {
  it('returns a user when searching by displayName', async () => {
    const mockUser = await mockScout({
      displayName: `test-user-${Math.random().toString(36).substring(2, 15)}`
    });

    const result = await getUsers({ searchString: mockUser.displayName });
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mockUser.id);
  });

  it('returns a user when searching by partial match of displayName', async () => {
    const testUserPrefix = Math.random().toString(36).substring(2, 15);
    const mockUser = await mockScout({
      displayName: `${testUserPrefix}TestUser`
    });

    const result = await getUsers({ searchString: testUserPrefix });
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mockUser.id);
  });

  it('returns a user when searching by farcasterName', async () => {
    const mockUser = await mockScout({
      farcasterName: `test-user-${Math.random().toString(36).substring(2, 15)}`
    });

    const result = await getUsers({ searchString: mockUser.farcasterName });
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mockUser.id);
  });

  it('returns a user when searching by path', async () => {
    const mockUser = await mockScout({
      path: `test-user-path-${Math.random().toString(36).substring(2, 15)}`
    });

    const result = await getUsers({ searchString: mockUser.path });
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mockUser.id);
  });

  it('returns a user when searching by github username', async () => {
    const mockUser = await mockBuilder({
      githubUserLogin: `test-user-${Math.random().toString(36).substring(2, 15)}`
    });

    const result = await getUsers({ searchString: mockUser.githubUser.login });
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mockUser.id);
  });
});
