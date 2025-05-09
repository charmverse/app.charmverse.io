import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = apiHandler();

handler.get(computeProposalPermissions);

/**
 * @swagger
 * components:
 *   schemas:
 *     ProposalPermissionFlags:
 *       type: object
 *       properties:
 *         edit:
 *           type: boolean
 *           example: false
 *         view:
 *           type: boolean
 *           example: true
 *         delete:
 *           type: boolean
 *           example: false
 *         create_vote:
 *           type: boolean
 *           example: false
 *         vote:
 *           type: boolean
 *           example: true
 *         comment:
 *           type: boolean
 *           example: true
 *         review:
 *           type: boolean
 *           example: false
 *         evaluate:
 *           type: boolean
 *           example: false
 *         make_public:
 *           type: boolean
 *           example: false
 *         archive:
 *           type: boolean
 *           example: false
 *         unarchive:
 *           type: boolean
 *           example: false
 *     ProposalPermissions:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           nullable: true
 *           description: User ID of the user for whom permissions are computed. Optional.
 *           example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *         proposalId:
 *           type: string
 *           description: The ID of the proposal for which permissions are computed.
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         permissions:
 *           $ref: '#/components/schemas/ProposalPermissionFlags'
 */
export type PublicProposalApiPermissions = {
  userId?: string;
  proposalId: string;
  permissions: ProposalPermissionFlags;
};

/**
 * @swagger
 * /proposals/{proposalIdOrPath}/compute-permissions:
 *   get:
 *     summary: Compute user permissions for a proposal
 *     description: Compute the permissions for a proposal and user depending on the current proposal stage.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         description: The ID or page link of ie. "page-123344453" of the proposal for which to compute permissions.
 *         schema:
 *           type: string
 *       - name: userId
 *         in: query
 *         required: false
 *         description: The ID of the user for whom to compute permissions. Optional.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Computed permissions for the proposal and user.
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ProposalPermissions'
 */
async function computeProposalPermissions(req: NextApiRequest, res: NextApiResponse<PublicProposalApiPermissions>) {
  const spaceId = req.authorizedSpaceId;

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: spaceId
      }),
      spaceId:
        req.authorizedSpaceId ??
        (req.spaceIdRange
          ? {
              in: req.spaceIdRange
            }
          : undefined)
    },
    select: {
      id: true
    }
  });

  const userId = req.query.userId as string | undefined;

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposal.id,
    userId
  });

  return res.status(200).json({
    permissions,
    proposalId: proposal.id,
    userId
  });
}

export default withSessionRoute(handler);
