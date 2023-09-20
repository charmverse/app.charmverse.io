import type { ProposalPermissionFlags } from '@charmverse/core/dist/cjs/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

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
 *         view:
 *           type: boolean
 *         delete:
 *           type: boolean
 *         create_vote:
 *           type: boolean
 *         vote:
 *           type: boolean
 *         comment:
 *           type: boolean
 *         review:
 *           type: boolean
 *         evaluate:
 *           type: boolean
 *         make_public:
 *           type: boolean
 *         archive:
 *           type: boolean
 *         unarchive:
 *           type: boolean
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
 *     summary: Compute Permissions
 *     description: Compute the permissions for a given resource and user.
 *     tags:
 *      - 'Permission API'
 *     parameters:
 *       - name: resourceId
 *         in: query
 *         required: true
 *         description: The ID of the resource for which to compute permissions.
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
 *         description: Computed permissions for the resource and user.
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/PublicProposalApiPermissions'
 */
async function computeProposalPermissions(req: NextApiRequest, res: NextApiResponse<PublicProposalApiPermissions>) {
  const spaceId = req.authorizedSpaceId;

  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: generatePageQuery({
        pageIdOrPath: req.query.proposalId as string,
        spaceIdOrDomain: spaceId
      })
    },
    select: {
      id: true
    }
  });

  const userId = req.query.userId as string | undefined;

  const permissions = await premiumPermissionsApiClient.proposals.computeProposalPermissions({
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
