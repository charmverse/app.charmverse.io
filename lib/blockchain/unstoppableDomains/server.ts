import type { Prisma } from '@prisma/client';
import { verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { DataNotFoundError } from 'lib/utilities/errors';
import { lowerCaseEqual } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';

import type { ProofContent, UnstoppableDomainsAuthSig } from './interfaces';

export function verifyUnstoppableDomainsSignature(authSig: UnstoppableDomainsAuthSig): boolean {
  const { idToken } = authSig;

  const verificationKey = idToken.amr.find((item) => item.match('v1.sig.ethereum.'));

  if (!verificationKey) {
    return false;
  }

  const address = verificationKey.split('v1.sig.ethereum.')?.[1];

  const proofs = idToken.proof as Record<string, ProofContent>;

  const verificationProof = proofs[verificationKey as any];
  const verificationParams = verificationProof.template.params;

  const chainId = parseInt(verificationParams.chainId.split('Chain ID:')[1].trim());
  const nonce = verificationParams.nonce;
  const issuedAt = new Date(parseInt(verificationParams.issuedAt)).toISOString();

  const payload: Partial<SiweMessage> = {
    address: verificationParams.address,
    chainId,
    // requestId: idToken.sid,
    domain: 'identity.unstoppabledomains.com',
    version: '1',
    nonce,
    issuedAt,
    uri: verificationParams.uri,
    statement: 'I consent to giving access to: openid wallet'
    //    expirationTime: idToken.exp.toString()
  };

  // Try with params direct

  const message = new SiweMessage(payload);

  const body = message.prepareMessage();

  const signatureAddress = verifyMessage(body, verificationProof.signature);
  if (!lowerCaseEqual(signatureAddress, address)) {
    return false;
  }

  return true;
}
export async function assignUnstoppableDomainAsUserIdentity({
  userId,
  tx = prisma,
  domain
}: {
  userId: string;
  tx?: Prisma.TransactionClient;
  domain: string;
}): Promise<LoggedInUser> {
  const foundDomain = await tx.unstoppableDomain.findUnique({
    where: {
      domain
    }
  });

  if (!foundDomain || foundDomain.userId !== userId) {
    throw new DataNotFoundError(`Unstoppable domain ${domain} not found for user ${userId}`);
  }

  return tx.user.update({
    where: {
      id: userId
    },
    data: {
      identityType: 'UnstoppableDomain',
      username: domain
    },
    include: sessionUserRelations
  });
}
