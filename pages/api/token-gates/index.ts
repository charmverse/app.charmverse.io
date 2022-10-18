
import type { Space } from '@prisma/client';
import type { AccessControlCondition } from 'lit-js-sdk';
import { flatten } from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { accessTypeDict } from 'lib/metrics/mixpanel/constants';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { hasAccessToSpace, onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { getAccessTypes } from 'lib/token-gates/utils';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getTokenGates)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(saveTokenGate);

async function saveTokenGate (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const spaceId = req.body.spaceId;

  const { error } = await hasAccessToSpace({
    userId,
    spaceId,
    adminOnly: true
  });
  if (error) {
    throw error;
  }

  // Flatten to get all nested conditions in the same flat array
  const conditionsArr: AccessControlCondition[] = flatten(req.body.conditions?.unifiedAccessControlConditions);
  const conditions = conditionsArr.filter(c => Boolean(c.chain));
  const chains: string[] = req.body.conditions?.chains || [];
  const numberOfConditions = conditions.length;
  const accessTypes = getAccessTypes(conditions);

  // Make sure token gate has at least 1 condition.
  if (numberOfConditions < 1) {
    throw new InvalidInputError('Your token gate must contain at least one condition.');
  }

  const result = await prisma.tokenGate.create({
    data: {
      createdBy: req.session.user.id,
      ...req.body,
      accessTypes
    }
  });

  const chainTypeParam = chains.length === 1 ? chains[0] : chains;
  const accessTypesParam = accessTypes.length === 1 ? accessTypeDict[accessTypes[0]] : accessTypes.map(at => accessTypeDict[at]);
  trackUserAction('add_a_gate', { userId, spaceId, accesType: accessTypesParam, chainType: chainTypeParam, numberOfConditions });

  res.status(200).json(result);
}

async function getTokenGates (req: NextApiRequest, res: NextApiResponse<TokenGateWithRoles[]>) {

  let space: Pick<Space, 'id'> | null = null;

  const { spaceDomain } = req.query;

  // Get space id using the domain
  if (spaceDomain) {
    space = await prisma.space.findFirst({
      where: {
        domain: req.query.spaceDomain as string
      },
      select: {
        id: true
      }
    });
    if (!space) {
      throw new DataNotFoundError(`Space with domain ${spaceDomain}`);
    }
  }

  const spaceId = space?.id || req.query.spaceId as string;

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const result = await prisma.tokenGate.findMany({
    where: {
      spaceId
    },
    include: {
      space: true,
      tokenGateToRoles: {
        include: {
          role: true
        }
      }
    }
  });

  res.status(200).json(result);
}

export default withSessionRoute(handler);
