import type { FormField } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import type { FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import { upsertProposalFormFields } from '@packages/lib/proposals/forms/upsertProposalFormFields';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(upsertProposalFormController);

async function upsertProposalFormController(req: NextApiRequest, res: NextApiResponse<FormField[]>) {
  const proposalId = req.query.id as string;
  const userId = req.session.user.id;
  if (!proposalId) {
    throw new InvalidInputError(`No proposal found with id: ${proposalId}`);
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.edit) {
    throw new ActionNotPermittedError(`You can't update this proposal.`);
  }

  const { formFields } = req.body as { formFields: FormFieldInput[] };

  const updatedFormFields = await upsertProposalFormFields({
    proposalId,
    formFields
  });

  res.status(200).send(updatedFormFields);
}

export default withSessionRoute(handler);
