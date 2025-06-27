import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import type { LoggedInUser } from '@packages/profile/getUser';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { v4 as uuid } from 'uuid';

import type { DecodedIdToken } from '../firebaseApp';
import type { MagicLinkLoginRequest } from '../loginWithMagicLink';
import { loginWithMagicLink } from '../loginWithMagicLink';

const avatarUrl = 'https://www.example.com/profile.png';

const mockVerifyIdToken = jest
  .fn()
  .mockImplementation((token: string) => Promise.resolve({ email: token, aud: '123' } as DecodedIdToken));

jest.mock('lib/google/firebaseApp', () => ({
  firebaseApp: {
    auth: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken
    }))
  }
}));

describe('loginWithMagicLink', () => {
  it('should create the user if they do not exist', async () => {
    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: `test-${uuid()}@example.com`,
        avatarUrl
      }
    };

    const { user, isNew } = await loginWithMagicLink(loginRequest);

    expect(isNew).toBe(true);
    expect(user).toMatchObject(
      expect.objectContaining<Partial<LoggedInUser>>({
        verifiedEmails: [
          {
            email: loginRequest.magicLink.accessToken,
            name: loginRequest.magicLink.accessToken
          }
        ]
      })
    );
  });

  it('should return the user if they already have a verified email to the user account', async () => {
    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: `test-${uuid()}@example.com`,
        avatarUrl
      }
    };

    const firstLoginResult = await loginWithMagicLink(loginRequest);

    expect(firstLoginResult.isNew).toBe(true);
    expect(firstLoginResult.user).toMatchObject(
      expect.objectContaining<Partial<LoggedInUser>>({
        verifiedEmails: [
          {
            email: loginRequest.magicLink.accessToken,
            name: loginRequest.magicLink.accessToken
          }
        ]
      })
    );
    const secondLoginResult = await loginWithMagicLink(loginRequest);

    expect(secondLoginResult.isNew).toBe(false);
    expect(secondLoginResult.user).toMatchObject(firstLoginResult.user);
  });

  it('should return the user if they already have a verified email to the user account if they only have a Google Account', async () => {
    const user = await testUtilsUser.generateUser();

    const email = `test-${uuid()}@example.com`;

    await prisma.googleAccount.create({
      data: {
        avatarUrl,
        email,
        name: 'Email',
        userId: user.id
      }
    });

    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: email,
        avatarUrl
      }
    };

    const loginResult = await loginWithMagicLink(loginRequest);

    expect(loginResult.isNew).toBe(false);
    expect(loginResult.user).toMatchObject(
      expect.objectContaining<Partial<LoggedInUser>>({
        ...user,
        verifiedEmails: [
          {
            email: loginRequest.magicLink.accessToken,
            name: loginRequest.magicLink.accessToken
          }
        ]
      })
    );
  });

  it('should return the user if they already have a notification email to the user account if they only have a Google Account', async () => {
    const email = `test-${uuid()}@example.com`;
    const { user } = await generateUserAndSpace({
      user: { email }
    });

    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: email,
        avatarUrl
      }
    };

    const loginResult = await loginWithMagicLink(loginRequest);

    expect(loginResult.isNew).toBe(false);
    expect(loginResult.user).toMatchObject(
      expect.objectContaining<Partial<LoggedInUser>>({
        id: user.id,
        verifiedEmails: [
          {
            email: loginRequest.magicLink.accessToken,
            name: loginRequest.magicLink.accessToken
          }
        ]
      })
    );
  });

  it('should return the user if they already have a verified email to the unclaimed user account', async () => {
    const user = await testUtilsUser.generateUser();
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        claimed: false
      }
    });
    const email = `test-${uuid()}@example.com`;
    await prisma.verifiedEmail.create({
      data: {
        avatarUrl,
        email,
        name: 'Email',
        userId: user.id
      }
    });

    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: email,
        avatarUrl
      }
    };

    const loginResult = await loginWithMagicLink(loginRequest);
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id
      }
    });
    expect(updatedUser.claimed).toBe(true);
    expect(loginResult.isNew).toBe(true);
  });

  it('should throw an error if the token decoding failed', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: undefined });

    const loginRequest: MagicLinkLoginRequest = {
      magicLink: {
        // The mocked implementation returns the access token as the email
        accessToken: `test-${uuid()}@example.com`,
        avatarUrl
      }
    };

    await expect(loginWithMagicLink(loginRequest)).rejects.toBeInstanceOf(InvalidInputError);
  });
});
