/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
import type { Space } from '@prisma/client';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getSpacesByName } from '../getSpacesByName';

let space!: Space;
const spaceName = v4();

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true, spaceName);
  space = generated.space;
});

describe('getSpacesByName', () => {

  it('should return matched spaces using its name', async () => {
    const [result] = await getSpacesByName(space.name);
    expect(result?.id).toBe(space.id);
    expect(result?.name).toBe(space.name);
    expect(result?.domain).toBe(space.domain);
  });
});
