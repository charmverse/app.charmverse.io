import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { LoggedInUser } from 'models';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { getAddress, toUtf8Bytes, verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';
import { lowerCaseEqual } from '../../../lib/utilities/strings';

type LoginRequest = {
  address: string;
  walletSignature: AuthSig;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<LoginRequest>(['address', 'walletSignature'], 'body'))
  .post(login);

async function login (req: NextApiRequest, res: NextApiResponse<LoggedInUser | { error: any }>) {
  const { address, walletSignature } = req.body as LoginRequest;

  const origin = req.headers.origin as string;

  const domain = origin.match('https') ? origin.split('https://')[1] : origin.split('http://')[1];

  // Extract chain id from the signature
  const chainId = walletSignature.signedMessage.split('Chain ID:')[1]?.split('\n')[0]?.trim();
  const nonce = walletSignature.signedMessage.split('Nonce:')[1]?.split('\n')[0]?.trim();
  const issuedAt = walletSignature.signedMessage.split('Issued At:')[1]?.split('\n')[0]?.trim();

  const preparedMessage = {
    domain,
    address: getAddress(address as string), // convert to EIP-55 format or else SIWE complains
    uri: origin,
    version: '1',
    chainId: parseInt(chainId),
    nonce,
    issuedAt
  };

  const message = new SiweMessage(preparedMessage);

  const body = message.prepareMessage();

  const signatureAddress = verifyMessage(body, walletSignature.sig);

  if (!lowerCaseEqual(signatureAddress, address)) {
    throw new UnauthorisedActionError('Invalid signature');
  }

  const user = await prisma.user.findFirst({
    where: {
      addresses: {
        has: address
      }
    },
    include: sessionUserRelations
  });

  if (!user) {
    return res.status(401).send({ error: 'No user has been associated with this wallet address' });
  }

  req.session.user = { id: user.id };
  await updateGuildRolesForUser(user.addresses, user.spaceRoles);
  await req.session.save();

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
