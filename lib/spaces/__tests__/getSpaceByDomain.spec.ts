/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
import type { Space } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getSpaceByDomain } from '../getSpaceByDomain';

let space!: Space;
const spaceName = v4();

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true, spaceName);
  space = generated.space;
});

describe('getSpaceByDomain', () => {
  it('should return a space using its domain', async () => {
    const result = await getSpaceByDomain(space.domain);
    expect(result?.id).toBe(space.id);
    expect(result?.name).toBe(space.name);
    expect(result?.domain).toBe(space.domain);
  });
});
