import { log } from '@charmverse/core/log';
import type { Page, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { logFirstUserPageCreation, logFirstWorkspacePageCreation } from 'lib/metrics/postToDiscord';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { createPage } from 'lib/pages/server/createPage';
import { PageNotFoundError } from 'lib/pages/server/errors';
import { getPage } from 'lib/pages/server/getPage';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(test);

async function test(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'ok' });
}

export default withSessionRoute(handler);
