/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { toggleSpaceDefaultPublicPage } from '../toggleSpaceDefaultPublicPage';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('toggleSpaceDefaultPublicPage', () => {

  it('should update the default public page value and return the space', async () => {

    const updatedSpace = await toggleSpaceDefaultPublicPage({
      defaultPublicPages: true,
      spaceId: space.id
    });

    expect(updatedSpace.defaultPublicPages).toBe(true);
  });

  it('should fail if the new value is not a boolean', async () => {
    try {
      await toggleSpaceDefaultPublicPage({
        defaultPublicPages: 'non boolean' as any,
        spaceId: space.id
      });

      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the space does not exist', async () => {
    try {
      await toggleSpaceDefaultPublicPage({
        defaultPublicPages: true,
        spaceId: v4()
      });

      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
