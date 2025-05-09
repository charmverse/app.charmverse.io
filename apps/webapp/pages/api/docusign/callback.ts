import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError, InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getUserDocusignOAuthTokenFromCode } from '@packages/lib/docusign/authentication';
import { decodeDocusignState } from '@packages/lib/docusign/encodeAndDecodeDocusignState';
import { getUserDocusignAccountsInfo } from '@packages/lib/docusign/getUserDocusignAccountsInfo';
import { setSpaceDocusignAccount } from '@packages/lib/docusign/setSpaceDocusignAccount';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(docusignCallback);

async function docusignCallback(req: NextApiRequest, res: NextApiResponse) {
  const authError = req.query.error as string;

  const sealedSpaceId = req.query.state as string;

  const state = await decodeDocusignState(sealedSpaceId);

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: state.spaceId
    },
    select: {
      domain: true
    }
  });

  try {
    const { spaceRole } = await hasAccessToSpace({
      spaceId: state.spaceId,
      userId: state.userId
    });

    // Early return if the user rejected signin
    if (authError) {
      throw new InvalidStateError('User rejected Docusign signin');
    }

    if (!spaceRole?.isAdmin) {
      throw new ActionNotPermittedError('Only admins can connect your space Docusign');
    }

    const token = await getUserDocusignOAuthTokenFromCode({
      code: req.query.code as string
    });

    const userAccounts = await getUserDocusignAccountsInfo({
      accessToken: token.access_token
    });

    let account = userAccounts.find((acc) => acc.isDefaultAccount);

    if (!account || !account.isAdmin) {
      const adminAccount = userAccounts.find((acc) => acc.isAdmin);
      if (!adminAccount) {
        throw new Error('User must be an admin of a Docusign account');
      }
      account = adminAccount;
    }

    await setSpaceDocusignAccount({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      docusignAccountId: account.docusignAccountId,
      spaceId: state.spaceId,
      userId: state.userId
    });
    return res.status(302).redirect(`/${space.domain}?settingTab=integrations`);
  } catch (err: any) {
    return res
      .status(302)
      .redirect(`/${space.domain}?callbackError=${encodeURIComponent(err.message ?? 'Docusign connection failed')}`);
  }
}

export default withSessionRoute(handler);
