/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
import type { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { getSpacePublicInfo } from '../getSpacePublicInfo';

let user!: User;
let space!: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('getSpacePublicInfo', () => {

  it('should return a space using its id', async () => {

    const result = await getSpacePublicInfo(space.id);

    expect(result?.id).toBe(space.id);
    expect(result?.name).toBe(space.name);
    expect(result?.domain).toBe(space.domain);

  });

  it('should return a space using its domain', async () => {

    const result = await getSpacePublicInfo(space.domain);

    expect(result?.id).toBe(space.id);
    expect(result?.name).toBe(space.name);
    expect(result?.domain).toBe(space.domain);

  });

  it('should return a space using the id of one of its pages id', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const result = await getSpacePublicInfo(page.id);

    expect(result?.id).toBe(space.id);
    expect(result?.name).toBe(space.name);
    expect(result?.domain).toBe(space.domain);

  });
});
