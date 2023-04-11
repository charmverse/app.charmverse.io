import type { Space } from '@prisma/client';

import { generateUserAndSpace } from 'testing/setupDatabase';

import { listPermissions } from '../listPermissions';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
});

describe('listPermissions', () => {
  it('should return space permissions even if none exist in the DB', async () => {
    const permissions = await listPermissions({ spaceId: space.id });
    expect(permissions.space.length).toBe(1);
  });
});
