import type { User } from '@prisma/client';
import { mockWalletSignature } from '__e2e__/utils/web3';
import { ethers, Wallet } from 'ethers';
import { SiweMessage } from 'lit-siwe';

import { prisma } from 'db';
import { paramToHumanFormat } from 'lib/metrics/mixpanel/utils';
import { DataNotFoundError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ProofParams, UnstoppableDomainsAuthSig } from '../unstoppableDomains';
import { assignUnstoppableDomainAsUserIdentity, verifyUnstoppableDomainsSignature } from '../unstoppableDomains';

// TODO - Add in a real signature we can reverify once we've built replay attack protection

// Rename file to .spec.ts once we have a test to implement

// import { verifyUnstoppableDomainsSignature, exampleSignature } from '../verifyUnstoppableDomainsSignature';
// mock the result of the wallet signature, this gets checked on login by the backend
/*
export async function mockUnstoppableDomainsWalletSignature({
  address,
  chainId = 1,
  privateKey
}: {
  address: string;
  chainId?: number;
  privateKey: string;
}): Promise<UnstoppableDomainsAuthSig> {
  const payload: Partial<SiweMessage> = {
    address,
    chainId: 1,
    domain: 'identity.unstoppabledomains.com',
    version: '1',
    issuedAt: new Date().toISOString(),
    uri: `uns:exampledomain.crypto`,
    statement: 'I consent to giving access to: openid wallet'
  };

  const message = new SiweMessage(payload);
  const prepared = message.prepareMessage();

  // sign message
  const etherswallet = Wallet.createRandom({ privateKey });

  const signedMessage = await etherswallet.signMessage(prepared);

  const authSig = {
    address,
    derivedVia: 'charmverse-mock',
    sig: signedMessage,
    signedMessage: prepared
  };

  // \n characters are not parseable by default
  const sanitizedString = JSON.stringify(authSig).replace(/\\n/g, '\\\\n');
  const nonce = ethers.utils.hashMessage(sanitizedString);

  return {
    accessToken: 'abc123',
    expiresAt: Date.now() + 1000,
    idToken: {
      amr: ['swk', `v1.sign.ethereum.${address}`],
      iss: 'https://auth.unstoppabledomains.com/',
      wallet_address: address,
      proof: {
        [`v1.sign.ethereum.${address}`]: {
          message: prepared,
          signature: sanitizedString,
          template: {
            params: {
              issuedAt: payload.issuedAt as string,
              nonce: '0',
              uri: payload.uri as any,
              statement: payload.statement as string,
              domain: payload.domain as string,
              address,
              chainId: `Chain ID: ${chainId}`,
              version: '1',
              chainName: 'Ethereum'
            }
          },
          type: 'hybrid'
        }
      }
    }
  };
}
*/

// describe('verifyUnstoppableDomainsSignature', () => {
//   it('should verify the signature', async () => {
//     const userWallet = Wallet.createRandom();

//     const address = userWallet.address;
//     const privateKey = userWallet.privateKey;

//     const mockSignature = await mockUnstoppableDomainsWalletSignature({
//       address,
//       privateKey,
//       chainId: 1
//     });

//     expect(verifyUnstoppableDomainsSignature(mockSignature)).toBe(true);
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
