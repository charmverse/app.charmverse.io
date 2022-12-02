import type { User } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { assignUnstoppableDomainAsUserIdentity } from '../verifyUnstoppableDomainsSignature';

// TODO - Add in a real signature we can reverify once we've built replay attack protection

// Rename file to .spec.ts once we have a test to implement

// import { verifyUnstoppableDomainsSignature, exampleSignature } from '../verifyUnstoppableDomainsSignature';

// describe('verifyUnstoppableDomainsSignature', () => {

//   it('should verify the signature', () => {
//     expect(verifyUnstoppableDomainsSignature(exampleSignature)).toBe(true);
//   });
// });

describe('assignUnstoppableDomainAsUserIdentity', () => {
  it('should assign the domain as the identity', async () => {
    const testDomainUri = 'testdomain.nft';

    const { user } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.unstoppableDomain.create({
      data: {
        domain: testDomainUri,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    await assignUnstoppableDomainAsUserIdentity({
      domain: testDomainUri,
      userId: user.id
    });

    const updatedUser = (await prisma.user.findUnique({
      where: {
        id: user.id
      }
    })) as User;

    expect(updatedUser.identityType).toBe('UnstoppableDomain');
    expect(updatedUser.username).toBe(testDomainUri);
  });

  it('should fail if the domain is not assigned to the user identity', async () => {
    const testDomainUri = 'testdomain2.nft';

    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const otherUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    await prisma.unstoppableDomain.create({
      data: {
        domain: testDomainUri,
        user: {
          connect: {
            id: otherUser.id
          }
        }
      }
    });

    await expect(
      assignUnstoppableDomainAsUserIdentity({
        domain: testDomainUri,
        userId: user.id
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
