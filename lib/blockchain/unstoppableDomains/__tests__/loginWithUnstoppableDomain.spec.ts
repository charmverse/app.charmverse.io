import { prisma } from '@charmverse/core';

import { createUserFromWallet } from 'lib/users/createUser';
import { DisabledAccountError } from 'lib/utilities/errors';
import { shortWalletAddress } from 'lib/utilities/strings';
import { randomDomain, randomETHWalletAddress } from 'testing/generateStubs';

import type { UnstoppableDomainsAuthSig } from '../interfaces';
import { loginWithUnstoppableDomain } from '../loginWithUnstoppableDomain';

function unstoppableDomainsSignatureStub({
  address,
  domain
}: {
  address: string;
  domain: string;
}): UnstoppableDomainsAuthSig {
  return {
    idToken: {
      amr: ['swk', `v1.sign.ethereum.${address}`],
      iss: 'https://auth.unstoppabledomains.com/',
      wallet_address: address,
      proof: {
        [`v1.sign.ethereum.${address}`]: {
          type: 'hybrid',
          message: 'I consent to giving access to: openid wallet',
          signature: '0x123',
          template: {
            params: {
              address,
              chainId: 'Chain ID: 1',
              issuedAt: new Date().toISOString(),
              chainName: 'Ethereum',
              nonce: 'nonce',
              uri: `uns:${domain}`,
              domain,
              statement: 'I consent to giving access to: openid wallet',
              version: '1'
            }
          }
        }
      }
    },
    accessToken: 'access-token',
    expiresAt: Date.now() + 3600000
  };
}

jest.mock('../verifyUnstoppableDomainsSignature', () => {
  return {
    verifyUnstoppableDomainsSignature: (signature: UnstoppableDomainsAuthSig) => true
  };
});
afterAll(async () => {
  jest.resetModules();
});

describe('loginWithUnstoppableDomain', () => {
  it('should create a new user if no user exists with the given domain address, and set it as their username', async () => {
    const address = randomETHWalletAddress();
    const domain = randomDomain();

    const authSig = unstoppableDomainsSignatureStub({ address, domain });

    const user = await loginWithUnstoppableDomain({ authSig });

    expect(user).toBeDefined();
    expect(user.unstoppableDomains[0].domain).toBe(domain);
    expect(user.username).toBe(domain);
  });

  it('should add the domain to an existing user who has the address owning the domain ', async () => {
    const address = randomETHWalletAddress();

    const user = await createUserFromWallet({
      address
    });

    const domain = randomDomain();

    const authSig = unstoppableDomainsSignatureStub({ address, domain });

    const userAfterUpdate = await loginWithUnstoppableDomain({ authSig });

    expect(userAfterUpdate).toBeDefined();
    expect(userAfterUpdate.id).toBe(user.id);
    expect(userAfterUpdate.unstoppableDomains[0].domain).toBe(domain);
    expect(user.username).toBe(shortWalletAddress(address));
  });

  it('should fail if the user is marked as deleted and had a domain', async () => {
    const address = randomETHWalletAddress();

    const user = await createUserFromWallet({
      address
    });

    const domain = randomDomain();

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        deletedAt: new Date(),
        unstoppableDomains: {
          create: {
            domain
          }
        }
      }
    });
    const authSig = unstoppableDomainsSignatureStub({ address, domain });

    await expect(loginWithUnstoppableDomain({ authSig })).rejects.toBeInstanceOf(DisabledAccountError);
  });

  it('should fail if the user is marked as deleted and did not yet have a domain', async () => {
    const address = randomETHWalletAddress();

    const user = await createUserFromWallet({
      address
    });

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        deletedAt: new Date()
      }
    });

    const domain = randomDomain();

    const authSig = unstoppableDomainsSignatureStub({ address, domain });

    await expect(loginWithUnstoppableDomain({ authSig })).rejects.toBeInstanceOf(DisabledAccountError);
  });
});
